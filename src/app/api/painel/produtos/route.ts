import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
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

    const cookieStore = request.cookies;
    const impersonateCompanyId = cookieStore.get("company_id")?.value;
    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);

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

    let query = `
      SELECT id, company_id, name, slug, description, price, promo_price, status,
             images, cover_image, layout_template, whatsapp_destination,
             layout_color, layout_theme, layout_font, cta_text, cta_icon, cta_animation, headline, guarantee_text,
             benefits, benefits_icon, offer_box_style, external_link, sends_count, views_count, clicks_count, created_at, updated_at
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

    // Métricas
    const [metricsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_products,
        SUM(sends_count) as total_sends,
        SUM(views_count) as total_views,
        SUM(clicks_count) as total_clicks
       FROM company_products
       WHERE company_id = ?`,
      [companyId]
    );

    const metrics = metricsRows[0] || {
      total_products: 0,
      total_sends: 0,
      total_views: 0,
      total_clicks: 0,
    };

    return NextResponse.json({
      success: true,
      products: parsedProducts,
      metrics: {
        total_products: Number(metrics.total_products) || 0,
        total_sends: Number(metrics.total_sends) || 0,
        total_views: Number(metrics.total_views) || 0,
        total_clicks: Number(metrics.total_clicks) || 0,
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

    const cookieStore = request.cookies;
    const impersonateCompanyId = cookieStore.get("company_id")?.value;
    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);

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
