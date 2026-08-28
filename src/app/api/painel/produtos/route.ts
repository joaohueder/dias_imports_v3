import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCurrentCompanyUser, getCurrentSaUser, getEffectiveCompanyId } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// GET - Listar produtos com busca, filtros e métricas
export async function GET(request: NextRequest) {
  try {
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const archived = searchParams.get("archived") || "exclude";

    const companyId = await getEffectiveCompanyId(user, request.cookies);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não associada" }, { status: 403 });
    }

    const pool = getDbPool();

    // Garante que a tabela exista
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        promo_price DECIMAL(10, 2) NULL,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        images JSON NULL,
        cover_image TEXT NULL,
        whatsapp_destination VARCHAR(50) NULL DEFAULT 'default',
        meta_ads_active BOOLEAN NOT NULL DEFAULT FALSE,
        layout_color VARCHAR(50) NULL DEFAULT '#6366f1',
        layout_theme VARCHAR(50) NULL DEFAULT 'dark',
        cta_text VARCHAR(100) NULL DEFAULT 'Comprar no WhatsApp',
        headline VARCHAR(255) NULL,
        guarantee_text VARCHAR(255) NULL,
        benefits JSON NULL,
        external_link TEXT NULL,
        sends_count INT NOT NULL DEFAULT 0,
        views_count INT NOT NULL DEFAULT 0,
        clicks_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_products_company (company_id),
        INDEX idx_company_products_slug (company_id, slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Garante que a coluna sends_count exista caso a tabela já tenha sido criada
    try {
      await pool.query(`ALTER TABLE company_products ADD COLUMN sends_count INT NOT NULL DEFAULT 0 AFTER external_link`);
    } catch {
      // Ignora caso a coluna já exista
    }

    // Garante as colunas last_accessed_at e is_archived caso a tabela já exista
    try {
      await pool.query(`ALTER TABLE company_products ADD COLUMN last_accessed_at TIMESTAMP NULL DEFAULT NULL AFTER clicks_count`);
    } catch {}
    try {
      await pool.query(`ALTER TABLE company_products ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE AFTER status`);
    } catch {}

    let query = `
      SELECT id, company_id, name, slug, description, price, promo_price, status, is_archived,
             images, cover_image, layout_template, whatsapp_destination,
             layout_color, layout_theme, layout_font, cta_text, cta_icon, cta_animation, headline, guarantee_text,
             benefits, benefits_icon, offer_box_style, external_link, sends_count, views_count, clicks_count, last_accessed_at, created_at, updated_at
      FROM company_products
      WHERE company_id = ?
    `;
    const params: any[] = [companyId];

    if (search) {
      query += ` AND (name LIKE ? OR description LIKE ? OR headline LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status !== "all") {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (archived === "only") {
      query += ` AND is_archived = 1`;
    } else if (archived === "exclude") {
      query += ` AND (is_archived = 0 OR is_archived IS NULL)`;
    } // if "all", não filtra por is_archived

    query += ` ORDER BY id DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // Parse JSON fields
    const parsedProducts = rows.map((p) => {
      let images = [];
      let benefits = [];
      try {
        images = typeof p.images === "string" ? JSON.parse(p.images) : p.images || [];
      } catch {
        images = [];
      }
      try {
        benefits = typeof p.benefits === "string" ? JSON.parse(p.benefits) : p.benefits || [];
      } catch {
        benefits = [];
      }
      return {
        ...p,
        price: Number(p.price) || 0,
        promo_price: p.promo_price !== null ? Number(p.promo_price) : null,
        images,
        benefits,
      };
    });

    // Métricas atualizadas:
    // 1. Produtos ativos vs cadastrados
    // 2. Envios hoje vs Limite diário do plano
    // 3. Envios do período da assinatura vs Limite total/mensal
    // 4. Visualizações totais
    const [productStatsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN status = 'active' AND is_archived = 0 THEN 1 ELSE 0 END) as active_products,
        SUM(views_count) as total_views,
        SUM(clicks_count) as total_clicks
       FROM company_products
       WHERE company_id = ?`,
      [companyId]
    );

    const prodStats = productStatsRows[0] || {
      total_products: 0,
      active_products: 0,
      total_views: 0,
      total_clicks: 0,
    };

    // Busca assinatura ativa e seus limites de plano (snapshot ou plano vinculado)
    const [subRows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.current_period_start, s.current_period_end, s.created_at,
              s.plan_snapshot_max_messages_day, s.plan_snapshot_max_products, s.plan_snapshot_max_views,
              p.max_messages_day as plan_max_messages_day,
              p.max_products as plan_max_products,
              p.max_views as plan_max_views,
              p.billing_cycle
       FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.company_id = ? AND s.status = 'active'
       ORDER BY s.id DESC
       LIMIT 1`,
      [companyId]
    );

    const activeSub = subRows[0] || null;

    // Limite diário de mensagens (0 = ilimitado)
    const limitDaily = activeSub
      ? Number(activeSub.plan_snapshot_max_messages_day ?? activeSub.plan_max_messages_day ?? 1000)
      : 500;

    // Limite da assinatura (mensal / período = diário * 30 ou valor proporcional)
    const limitSubscription = limitDaily > 0 ? limitDaily * 30 : 0;

    // Limite de produtos do plano (0 = ilimitado)
    const limitProducts = activeSub
      ? Number(activeSub.plan_snapshot_max_products ?? activeSub.plan_max_products ?? 0)
      : 0;

    // Limite de visualizações do plano/assinatura (0 = ilimitado)
    const limitViews = activeSub
      ? Number(activeSub.plan_snapshot_max_views ?? activeSub.plan_max_views ?? 0)
      : 0;

    // Envios hoje (disparos criados hoje no background_jobs para esta empresa)
    const [jobsTodayRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as sends_today
       FROM background_jobs
       WHERE queue_name LIKE 'whatsapp-messages%'
         AND (status = 'completed' OR status = 'active' OR status = 'waiting' OR status = 'delayed')
         AND DATE(created_at) = CURDATE()
         AND (
           JSON_UNQUOTE(JSON_EXTRACT(payload, '$.company_id')) = ? 
           OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.companyId')) = ?
         )`,
      [String(companyId), String(companyId)]
    );

    const sendsToday = Number(jobsTodayRows[0]?.sends_today || 0);

    // Envios no período da assinatura (se houver data de início do período, senão últimos 30 dias)
    const subStartDate = activeSub?.current_period_start || activeSub?.created_at || null;
    let subSendsQuery = `SELECT COUNT(*) as sends_subscription
                         FROM background_jobs
                         WHERE queue_name LIKE 'whatsapp-messages%'
                           AND (status = 'completed' OR status = 'active' OR status = 'waiting' OR status = 'delayed')
                           AND (
                             JSON_UNQUOTE(JSON_EXTRACT(payload, '$.company_id')) = ? 
                             OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.companyId')) = ?
                           )`;
    const subSendsParams: any[] = [String(companyId), String(companyId)];

    if (subStartDate) {
      subSendsQuery += ` AND created_at >= ?`;
      subSendsParams.push(subStartDate);
    } else {
      subSendsQuery += ` AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    }

    const [jobsSubRows] = await pool.query<RowDataPacket[]>(subSendsQuery, subSendsParams);
    const sendsSubscription = Number(jobsSubRows[0]?.sends_subscription || 0);

    return NextResponse.json({
      success: true,
      products: parsedProducts,
      metrics: {
        total_products: Number(prodStats.total_products) || 0,
        active_products: Number(prodStats.active_products) || 0,
        limit_products: limitProducts,
        sends_today: sendsToday,
        limit_daily: limitDaily,
        sends_subscription: sendsSubscription,
        limit_subscription: limitSubscription,
        total_views: Number(prodStats.total_views) || 0,
        limit_views: limitViews,
        total_clicks: Number(prodStats.total_clicks) || 0,
      },
    });
  } catch (error: any) {
    console.error("Erro ao listar produtos:", error);
    return NextResponse.json({ success: false, message: error.message || "Erro ao listar produtos" }, { status: 500 });
  }
}

// POST - Criar novo produto
export async function POST(request: NextRequest) {
  try {
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const companyId = await getEffectiveCompanyId(user, request.cookies);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não associada" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      promo_price,
      status = "active",
      images = [],
      cover_image = null,
      layout_template = "default",
      whatsapp_destination = "default",
      layout_color = "#6366f1",
      layout_theme = "dark",
      layout_font = "sans_modern",
      cta_text = "Comprar no WhatsApp",
      cta_icon = "arrow-right",
      cta_animation = "none",
      headline = "",
      guarantee_text = "",
      benefits = [],
      benefits_icon = "check",
      offer_box_style = "model_1",
      external_link = "",
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "O nome do produto é obrigatório." }, { status: 400 });
    }

    const numPrice = parseFloat(price) || 0;
    const numPromoPrice = promo_price ? parseFloat(promo_price) : null;

    const pool = getDbPool();

    // Validação de limite de produtos do plano/assinatura ativa
    const [subRows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.plan_snapshot_max_products, p.max_products as plan_max_products
       FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.company_id = ? AND s.status = 'active'
       ORDER BY s.id DESC
       LIMIT 1`,
      [companyId]
    );

    const activeSub = subRows[0] || null;
    const limitProducts = activeSub
      ? Number(activeSub.plan_snapshot_max_products ?? activeSub.plan_max_products ?? 0)
      : 0;

    if (limitProducts > 0) {
      const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM company_products WHERE company_id = ?`,
        [companyId]
      );
      const currentTotal = Number(countRows[0]?.total || 0);
      if (currentTotal >= limitProducts) {
        return NextResponse.json(
          {
            success: false,
            limit_reached: true,
            message: `Limite de produtos atingido (${currentTotal}/${limitProducts}). Faça um upgrade do seu plano para cadastrar mais produtos e impulsionar suas vendas!`,
          },
          { status: 403 }
        );
      }
    }

    // Gerar slug único para o produto
    let baseSlug = generateSlug(name.trim());
    if (!baseSlug) baseSlug = "produto";
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const [existing] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM company_products WHERE company_id = ? AND slug = ? LIMIT 1`,
        [companyId, slug]
      );
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const chosenCover = cover_image || (images.length > 0 ? images[0] : null);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO company_products (
        company_id, name, slug, description, price, promo_price, status,
        images, cover_image, layout_template, whatsapp_destination,
        layout_color, layout_theme, layout_font, cta_text, cta_icon, cta_animation, headline, guarantee_text,
        benefits, benefits_icon, offer_box_style, external_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        name.trim(),
        slug,
        description ? description.trim() : "",
        numPrice,
        numPromoPrice,
        status === "inactive" ? "inactive" : "active",
        JSON.stringify(images),
        chosenCover,
        layout_template || "default",
        whatsapp_destination || "default",
        layout_color || "#6366f1",
        layout_theme || "dark",
        layout_font || "sans_modern",
        cta_text || "Comprar no WhatsApp",
        cta_icon || "arrow-right",
        cta_animation || "none",
        headline ? headline.trim() : "",
        guarantee_text ? guarantee_text.trim() : "",
        JSON.stringify(benefits),
        benefits_icon || "check",
        offer_box_style || "model_1",
        external_link ? external_link.trim() : "",
      ]
    );

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: "create",
      entityType: "company_products",
      entityId: result.insertId,
      companyId: companyId,
      newValues: {
        product_id: result.insertId,
        company_id: companyId,
        name: name.trim(),
        price: numPrice,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Produto criado com sucesso!",
      productId: result.insertId,
      slug,
    });
  } catch (error: any) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ success: false, message: error.message || "Erro ao criar produto" }, { status: 500 });
  }
}
