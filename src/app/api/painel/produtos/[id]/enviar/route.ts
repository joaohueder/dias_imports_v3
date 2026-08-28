import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { enqueueJob } from "@/lib/jobs-engine";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json().catch(() => ({}));
    const { model_mode = "random", template_id = null, group_ids = [] } = body;

    const pool = getDbPool();
    const [products] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, slug, price, promo_price, description, headline, cover_image FROM company_products WHERE id = ? AND company_id = ? LIMIT 1`,
      [id, companyId]
    );

    if (products.length === 0) {
      return NextResponse.json({ success: false, message: "Produto não encontrado" }, { status: 404 });
    }

    const product = products[0];

    // Validação de assinatura ativa e limites diários
    const [subRows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.plan_snapshot_max_messages_day, p.max_messages_day as plan_max_messages_day
       FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.company_id = ? AND s.status = 'active'
       ORDER BY s.id DESC
       LIMIT 1`,
      [companyId]
    );

    const activeSub = subRows[0] || null;

    if (!activeSub) {
      return NextResponse.json(
        {
          success: false,
          message: "Sua empresa não possui uma assinatura ativa para realizar disparos. Ative sua assinatura para continuar.",
        },
        { status: 403 }
      );
    }

    const limitDaily = Number(activeSub.plan_snapshot_max_messages_day ?? activeSub.plan_max_messages_day ?? 1000);

    // Busca grupos ativos aptos para envio de mensagens (abertos / permitidos)
    let groupQuery = `SELECT id, whatsapp_group_id, name, instance_id FROM company_whatsapp_groups WHERE company_id = ? AND status = 'active' AND group_type != 'closed' AND can_send_messages NOT IN ('admin_only', 'admin')`;
    const groupParams: any[] = [companyId];

    if (Array.isArray(group_ids) && group_ids.length > 0) {
      groupQuery += ` AND id IN (${group_ids.map(() => "?").join(",")})`;
      groupParams.push(...group_ids);
    }

    const [groups] = await pool.query<RowDataPacket[]>(groupQuery, groupParams);

    if (groups.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nenhum grupo ativo válido selecionado para envio." },
        { status: 400 }
      );
    }

    if (limitDaily > 0) {
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

      if (sendsToday + groups.length > limitDaily) {
        return NextResponse.json(
          {
            success: false,
            limit_reached: true,
            message: `Limite diário de envios atingido (${sendsToday}/${limitDaily} mensagens hoje). Este disparo de ${groups.length} mensagens excede sua cota diária. Faça upgrade do seu plano para liberar mais envios!`,
          },
          { status: 403 }
        );
      }
    }

    // Busca modelos de mensagem ativos
    let templateQuery = `SELECT id, title, content FROM company_message_templates WHERE company_id = ? AND status = 'active'`;
    const templateParams: any[] = [companyId];

    if (model_mode === "select" && template_id) {
      templateQuery += ` AND id = ?`;
      templateParams.push(template_id);
    }

    const [activeTemplates] = await pool.query<RowDataPacket[]>(templateQuery, templateParams);

    if (activeTemplates.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nenhum modelo de mensagem ativo disponível para envio." },
        { status: 400 }
      );
    }

    // Incrementa contador de envios do produto
    await pool.query(
      `UPDATE company_products SET sends_count = sends_count + 1 WHERE id = ?`,
      [id]
    );

    const origin = request.headers.get("origin") || request.nextUrl.origin || "";
    const pageUrl = `${origin}/p/${product.slug || product.id}`;

    // Obtém o nome da empresa para formatação
    const [companies] = await pool.query<RowDataPacket[]>(
      `SELECT name FROM companies WHERE id = ? LIMIT 1`,
      [companyId]
    );
    const companyName = companies.length > 0 && companies[0].name ? companies[0].name : "Dias Imports";

    // Formata números para variáveis
    const formatMoneyBrl = (val: any) => {
      if (val === null || val === undefined || val === "") return "";
      const num = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
      if (isNaN(num)) return String(val);
      return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    };

    const calculateDiscountPct = (price: any, promoPrice: any) => {
      const p = typeof price === "number" ? price : parseFloat(String(price || 0).replace(",", "."));
      const pp = typeof promoPrice === "number" ? promoPrice : parseFloat(String(promoPrice || 0).replace(",", "."));
      if (!p || !pp || pp >= p) return "0%";
      const pct = Math.round(((p - pp) / p) * 100);
      return `${pct}%`;
    };

    const pDe = product.price ? formatMoneyBrl(product.price) : "";
    const pPor = product.promo_price ? formatMoneyBrl(product.promo_price) : pDe;
    const pDescPct = calculateDiscountPct(product.price, product.promo_price);
    const pDesc = product.description || "";
    const pHeadline = product.headline || "";

    // Resolve mídia do produto em Base64 ou URL pública válida
    let productImageUrl: string | null = null;
    if (product.cover_image) {
      if (product.cover_image.startsWith("data:") || product.cover_image.startsWith("http://") || product.cover_image.startsWith("https://")) {
        // Se for URL localhost, a Evolution externa não consegue baixar; então tentamos converter para Base64 local
        if (product.cover_image.includes("localhost") || product.cover_image.includes("127.0.0.1")) {
          try {
            const { readFile } = await import("fs/promises");
            const path = await import("path");
            const localUrlPath = new URL(product.cover_image).pathname;
            const diskPath = path.join(process.cwd(), "public", localUrlPath);
            const fileBuf = await readFile(diskPath);
            const ext = path.extname(diskPath).toLowerCase().replace(".", "") || "jpeg";
            const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
            productImageUrl = `data:${mime};base64,${fileBuf.toString("base64")}`;
          } catch {
            productImageUrl = product.cover_image;
          }
        } else {
          productImageUrl = product.cover_image;
        }
      } else {
        // Caminho relativo local (/uploads/products/...)
        try {
          const { readFile } = await import("fs/promises");
          const path = await import("path");
          const diskPath = path.join(process.cwd(), "public", product.cover_image);
          const fileBuf = await readFile(diskPath);
          const ext = path.extname(diskPath).toLowerCase().replace(".", "") || "jpeg";
          const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
          productImageUrl = `data:${mime};base64,${fileBuf.toString("base64")}`;
        } catch {
          const cleanPath = product.cover_image.startsWith("/") ? product.cover_image : `/${product.cover_image}`;
          productImageUrl = `${origin}${cleanPath}`;
        }
      }
    }

    // Prepara lista embaralhada/rotativa de modelos caso seja modo aleatório
    const shuffledTemplates = [...activeTemplates].sort(() => Math.random() - 0.5);

    // Enfileira um job de trabalho individual para CADA grupo selecionado
    const enqueuedJobIds: string[] = [];

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];

      // Escolhe o template (se for aleatório, distribui garantindo modelos diferentes para cada grupo)
      const selectedTemplate =
        model_mode === "select" && template_id
          ? activeTemplates.find((t) => t.id === template_id) || activeTemplates[0]
          : shuffledTemplates[i % shuffledTemplates.length];

      // Preenche variáveis do template
      let messageText = selectedTemplate.content || "";
      messageText = messageText
        .replace(/\{nome_produto\}/g, product.name || "")
        .replace(/\{descricao_produto\}/g, pDesc)
        .replace(/\{descricao\}/g, pDesc)
        .replace(/\{preco_de\}/g, pDe)
        .replace(/\{preco_por\}/g, pPor)
        .replace(/\{desconto_pct\}/g, pDescPct)
        .replace(/\{link_produto\}/g, pageUrl)
        .replace(/\{headline\}/g, pHeadline)
        .replace(/\{nome_empresa\}/g, companyName)
        .replace(/\{nome_grupo\}/g, group.name || "");

      const jobId = await enqueueJob(
        "whatsapp-messages-default",
        `Disparo Produto: ${product.name} -> ${group.name}`,
        {
          company_id: companyId,
          product_id: product.id,
          product_name: product.name,
          group_id: group.id,
          group_name: group.name,
          recipient: group.whatsapp_group_id,
          number: group.whatsapp_group_id,
          message: messageText,
          text: messageText,
          media_url: productImageUrl,
          image_url: productImageUrl,
          file_name: product.name ? `${product.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.jpg` : "produto.jpg",
          template_id: selectedTemplate.id,
          template_title: selectedTemplate.title,
          instance_id: group.instance_id || null,
          page_url: pageUrl,
        }
      );

      enqueuedJobIds.push(jobId);
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: "send_campaign",
      entityType: "company_products",
      entityId: id,
      companyId: companyId,
      newValues: {
        product_id: id,
        product_name: product.name,
        total_groups: groups.length,
        jobs_created: enqueuedJobIds.length,
        model_mode,
        template_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Disparo do produto "${product.name}" enfileirado com sucesso! Criadas ${groups.length} tarefas de envio na fila.`,
      jobs_count: enqueuedJobIds.length,
    });
  } catch (error: any) {
    console.error("Erro ao enfileirar disparo do produto:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao enfileirar disparo" },
      { status: 500 }
    );
  }
}
