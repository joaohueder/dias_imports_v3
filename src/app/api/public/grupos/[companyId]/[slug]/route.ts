import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";
import { getRandomTestimonials } from "@/components/landing-templates/testimonialOptions";

function hashSha256(val: string): string {
  return crypto.createHash("sha256").update(val.trim().toLowerCase()).digest("hex");
}

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ companyId: string; slug: string }> }
) {
  try {
    const { companyId, slug } = await context.params;

    if (!companyId || !slug) {
      return NextResponse.json({ success: false, message: "Empresa ou slug não informados" }, { status: 400 });
    }

    const pool = getDbPool();

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        lp.*,
        c.name as company_name,
        c.trade_name as company_trade_name,
        c.logo_url as company_logo_url,
        c.meta_pixel_id,
        c.meta_pixel_active,
        (SELECT s.id FROM subscriptions s WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as active_sub_id,
        COALESCE(
          (SELECT s.plan_snapshot_max_leads FROM subscriptions s WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1),
          (SELECT p.max_leads FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1),
          0
        ) as quota_max_leads,
        (SELECT COUNT(*) FROM company_leads WHERE company_id = c.id) as current_leads_count
      FROM company_group_landing_pages lp
      INNER JOIN companies c ON c.id = lp.company_id
      WHERE (lp.company_id = ? OR c.id = ?) AND lp.slug = ? AND lp.status = 'active'
      LIMIT 1`,
      [companyId, companyId, slug]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Landing page não encontrada ou inativa" }, { status: 404 });
    }

    const page = rows[0];

    // Bloqueia acesso à landing page pública se a empresa não possuir assinatura ativa
    if (!page.active_sub_id) {
      return NextResponse.json(
        {
          success: false,
          error_code: "SUBSCRIPTION_INACTIVE",
          message: "Esta página de convite está temporariamente indisponível.",
          company_name: page.company_trade_name || page.company_name || "Grupo VIP",
          logo_url: page.logo_url || null,
        },
        { status: 403 }
      );
    }

    // Verifica cota máxima de leads da empresa antes de entregar a landing page pública
    const maxLeads = Number(page.quota_max_leads || 0);
    const currentLeads = Number(page.current_leads_count || 0);
    if (maxLeads > 0 && currentLeads >= maxLeads) {
      return NextResponse.json(
        {
          success: false,
          error_code: "LIMITE_LEAD",
          message: "Convite encerrado temporariamente. O limite de cadastros desta campanha foi atingido.",
          company_name: page.company_trade_name || page.company_name || "Grupo VIP",
          logo_url: page.logo_url || null,
        },
        { status: 403 }
      );
    }

    // Incrementa contagem de visualizações em background sem bloquear o retorno
    pool.query(
      `UPDATE company_group_landing_pages SET views_count = views_count + 1 WHERE id = ?`,
      [page.id]
    ).catch((e) => console.error("Erro ao incrementar views_count:", e));

    if (typeof page.benefits === "string") {
      try { page.benefits = JSON.parse(page.benefits); } catch { page.benefits = []; }
    }

    let activeTestimonialIds: string[] | undefined = undefined;
    if (typeof page.testimonials === "string") {
      try {
        const parsed = JSON.parse(page.testimonials);
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && typeof parsed[0] === "string") {
            activeTestimonialIds = parsed;
          }
        }
      } catch {
        activeTestimonialIds = undefined;
      }
    } else if (Array.isArray(page.testimonials) && page.testimonials.length > 0 && typeof page.testimonials[0] === "string") {
      activeTestimonialIds = page.testimonials;
    }
    
    // Sorteia 2 depoimentos dinâmicos e humanizados respeitando os IDs ativos da página
    const dynamicTestimonials = getRandomTestimonials(2, activeTestimonialIds).map((t) => ({
      name: t.name,
      comment: t.comment,
      stars: t.stars,
    }));

    return NextResponse.json({
      success: true,
      landing_page: {
        id: page.id,
        company_id: page.company_id,
        title: page.title,
        headline: page.headline,
        subheadline: page.subheadline,
        slug: page.slug,
        badge_text: page.badge_text,
        invite_link: page.invite_link,
        cover_image: page.cover_image,
        logo_url: page.logo_url || page.company_logo_url,
        layout_color: page.layout_color || "#6366f1",
        layout_theme: page.layout_theme || "dark",
        layout_font: page.layout_font || "plusjakarta_inter",
        form_button_text: page.form_button_text || "Entrar no Grupo VIP Grátis",
        benefits: page.benefits,
        testimonials: dynamicTestimonials,
        testimonials_enabled: page.testimonials_enabled !== false && page.testimonials_enabled !== 0,
        social_proof_count: page.social_proof_count,
        modal_title: page.modal_title,
        modal_description: page.modal_description,
        modal_button_text: page.modal_button_text,
        company_name: page.company_trade_name || page.company_name,
        meta_pixel_id: page.meta_pixel_id,
        meta_pixel_active: Boolean(page.meta_pixel_active),
      }
    });
  } catch (error: any) {
    console.error("Erro ao carregar landing page pública de grupo por empresa:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ companyId: string; slug: string }> }
) {
  try {
    const { companyId, slug } = await context.params;
    const body = await req.json();

    const name = String(body.name || "").trim();
    const whatsapp = String(body.whatsapp || "").replace(/\D/g, "");

    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, message: "Por favor, informe seu nome completo." }, { status: 400 });
    }

    if (!whatsapp || whatsapp.length < 10) {
      return NextResponse.json({ success: false, message: "Por favor, informe um WhatsApp válido com DDD." }, { status: 400 });
    }

    const pool = getDbPool();

    // Busca landing page para capturar id da empresa, link de convite e cota de leads
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT lp.*, c.meta_pixel_id, c.meta_pixel_access_token, c.meta_pixel_test_code, c.meta_pixel_active,
              COALESCE(
                (SELECT s.plan_snapshot_max_leads FROM subscriptions s WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1),
                (SELECT p.max_leads FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1),
                0
              ) as quota_max_leads,
              (SELECT COUNT(*) FROM company_leads WHERE company_id = c.id) as current_leads_count
       FROM company_group_landing_pages lp
       INNER JOIN companies c ON c.id = lp.company_id
       WHERE (lp.company_id = ? OR c.id = ?) AND lp.slug = ?
       LIMIT 1`,
      [companyId, companyId, slug]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Página não encontrada" }, { status: 404 });
    }

    const page = rows[0];

    // Verifica cota máxima de leads da empresa
    const maxLeads = Number(page.quota_max_leads || 0);
    const currentLeads = Number(page.current_leads_count || 0);
    if (maxLeads > 0 && currentLeads >= maxLeads) {
      return NextResponse.json(
        {
          success: false,
          error_code: "LIMITE_LEAD",
          message: "Convite encerrado temporariamente. O limite de cadastros desta campanha foi atingido.",
        },
        { status: 403 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    // Salva o lead no banco de dados
    await pool.query<ResultSetHeader>(
      `INSERT INTO company_leads (company_id, landing_page_id, name, whatsapp, ip_address, user_agent, origin_slug, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'converted')`,
      [page.company_id, page.id, name, whatsapp, ipAddress, userAgent, slug]
    );

    // Incrementa contador de leads na landing page
    await pool.query(
      `UPDATE company_group_landing_pages SET leads_count = leads_count + 1 WHERE id = ?`,
      [page.id]
    );

    // Disparo assíncrono para Meta Conversions API (CAPI Lead Event) se ativo
    if (page.meta_pixel_active && page.meta_pixel_id && page.meta_pixel_access_token) {
      try {
        const clientIp = ipAddress.split(",")[0].trim();
        const eventId = `lead_${page.id}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        const payload: any = {
          data: [
            {
              event_name: "Lead",
              event_time: Math.floor(Date.now() / 1000),
              event_id: eventId,
              event_source_url: `${req.nextUrl.origin}/g/${companyId}/${slug}`,
              action_source: "website",
              user_data: {
                fn: [hashSha256(name.split(" ")[0])],
                ph: [hashSha256(whatsapp.startsWith("55") ? whatsapp : `55${whatsapp}`)],
                client_ip_address: clientIp,
                client_user_agent: userAgent,
              },
              custom_data: {
                content_name: page.title,
                content_category: "Group VIP",
                currency: "BRL",
                value: 0,
              },
            },
          ],
        };

        if (page.meta_pixel_test_code) {
          payload.test_event_code = page.meta_pixel_test_code;
        }

        fetch(`https://graph.facebook.com/v19.0/${page.meta_pixel_id}/events?access_token=${page.meta_pixel_access_token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((err) => {
          console.error("Erro no envio assíncrono CAPI Meta Pixel:", err);
        });
      } catch (capiErr) {
        console.error("Falha ao preparar payload CAPI:", capiErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Lead registrado com sucesso!",
      invite_link: page.invite_link,
      modal: {
        title: page.modal_title || "Tudo pronto! 🎉",
        description: page.modal_description || "Seu acesso ao Grupo VIP foi liberado.",
        button_text: page.modal_button_text || "Acessar Grupo VIP no WhatsApp",
      },
    });
  } catch (error: any) {
    console.error("Erro ao registrar lead em /api/public/grupos/[companyId]/[slug]:", error);
    return NextResponse.json({ success: false, message: "Erro interno ao processar cadastro" }, { status: 500 });
  }
}
