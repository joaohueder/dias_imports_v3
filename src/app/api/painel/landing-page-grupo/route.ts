import { NextRequest, NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(req: NextRequest) {
  try {
    await initAuthDatabase();
    const companyUser = await getCurrentCompanyUser();
    const saUser = await getCurrentSaUser();

    const companyId = companyUser?.company_id || saUser?.company_id;
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const pool = getDbPool();

    // Busca grupos para associar se quiser
    const [groupsRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, invite_link, participants_count, avatar_url FROM company_whatsapp_groups WHERE company_id = ? ORDER BY name ASC`,
      [companyId]
    );

    // Busca landing page configurada da empresa (pega a primeira ou cria padrão)
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM company_group_landing_pages WHERE company_id = ? ORDER BY id ASC LIMIT 1`,
      [companyId]
    );

    let landingPage = rows[0] || null;

    if (!landingPage) {
      const defaultSlug = `vip-${companyId}`;
      const defaultInvite = groupsRows.length > 0 && groupsRows[0].invite_link ? groupsRows[0].invite_link : "https://chat.whatsapp.com/";
      const defaultGroupId = groupsRows.length > 0 ? groupsRows[0].id : null;

      const [insertRes] = await pool.query<ResultSetHeader>(
        `INSERT INTO company_group_landing_pages 
        (company_id, title, headline, subheadline, slug, badge_text, group_id, invite_link, layout_color, layout_theme, layout_font, form_button_text, benefits, testimonials, social_proof_count, modal_title, modal_description, modal_button_text, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          companyId,
          "Grupo VIP Exclusivo",
          "Receba ofertas secretas, lançamentos e descontos antes de todo mundo!",
          "Faça parte da nossa comunidade exclusiva no WhatsApp e tenha acesso a condições especiais que nunca postamos abertamente.",
          defaultSlug,
          "⚡ ACESSO ANTECIPADO & EXCLUSIVO",
          defaultGroupId,
          defaultInvite,
          "#6366f1",
          "dark",
          "plusjakarta_inter",
          "Quero Entrar no Grupo VIP Grátis",
          JSON.stringify([
            "Acesso antecipado aos melhores produtos e reposições",
            "Descontos e cupons relâmpago exclusivos para membros",
            "Atendimento prioritário e direto no WhatsApp",
            "100% gratuito e sem spam — apenas conteúdo VIP"
          ]),
          JSON.stringify([
            { name: "Guilherme S.", comment: "Economizei muito entrando no grupo VIP! Os descontos são reais.", stars: 5 },
            { name: "Juliana M.", comment: "Comprei lançamentos antes de esgotar o estoque. Vale muito a pena!", stars: 5 }
          ]),
          847,
          "🎉 Você está a um passo!",
          "Seu cadastro foi confirmado com sucesso. Clique no botão abaixo para ingressar diretamente no Grupo VIP no WhatsApp.",
          "Acessar Grupo VIP no WhatsApp",
          "active"
        ]
      );

      const [newRows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM company_group_landing_pages WHERE id = ?`,
        [insertRes.insertId]
      );
      landingPage = newRows[0];
    }

    if (landingPage) {
      if (typeof landingPage.benefits === "string") {
        try { landingPage.benefits = JSON.parse(landingPage.benefits); } catch { landingPage.benefits = []; }
      }
      if (typeof landingPage.testimonials === "string") {
        try { landingPage.testimonials = JSON.parse(landingPage.testimonials); } catch { landingPage.testimonials = []; }
      }
      if (landingPage.testimonials_enabled !== undefined) {
        landingPage.testimonials_enabled = landingPage.testimonials_enabled === 1 || landingPage.testimonials_enabled === true;
      } else {
        landingPage.testimonials_enabled = true;
      }
    }

    return NextResponse.json({
      success: true,
      company_id: companyId,
      landing_page: landingPage,
      groups: groupsRows
    });
  } catch (error: any) {
    console.error("Erro ao buscar landing page do grupo:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await initAuthDatabase();
    const companyUser = await getCurrentCompanyUser();
    const saUser = await getCurrentSaUser();

    const companyId = companyUser?.company_id || saUser?.company_id;
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const pool = getDbPool();

    // Sanitiza e normaliza slug
    let rawSlug = body.slug ? String(body.slug).trim().toLowerCase() : `vip-${companyId}`;
    rawSlug = rawSlug.replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-");

    // Verifica se existe outra página com este slug na mesma empresa
    const [existingSlug] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM company_group_landing_pages WHERE company_id = ? AND slug = ? AND id != ?`,
      [companyId, rawSlug, body.id || 0]
    );

    if (existingSlug.length > 0) {
      return NextResponse.json({ success: false, message: "Este link/slug já está em uso pela sua empresa. Escolha outro." }, { status: 400 });
    }

    const benefitsJson = JSON.stringify(Array.isArray(body.benefits) ? body.benefits : []);
    const testimonialsJson = JSON.stringify(Array.isArray(body.testimonials) ? body.testimonials : []);
    const testimonialsEnabled = body.testimonials_enabled !== false ? 1 : 0;

    if (body.id) {
      await pool.query(
        `UPDATE company_group_landing_pages SET
          title = ?,
          headline = ?,
          subheadline = ?,
          slug = ?,
          badge_text = ?,
          group_id = ?,
          invite_link = ?,
          cover_image = ?,
          logo_url = ?,
          layout_color = ?,
          layout_theme = ?,
          layout_font = ?,
          form_button_text = ?,
          benefits = ?,
          testimonials = ?,
          testimonials_enabled = ?,
          social_proof_count = ?,
          modal_title = ?,
          modal_description = ?,
          modal_button_text = ?,
          status = ?
        WHERE id = ? AND company_id = ?`,
        [
          body.title || "Grupo VIP Exclusivo",
          body.headline || "Receba ofertas secretas e novidades em primeira mão!",
          body.subheadline || "",
          rawSlug,
          body.badge_text || "⚡ ACESSO ANTECIPADO",
          body.group_id ? Number(body.group_id) : null,
          body.invite_link || "",
          body.cover_image || null,
          body.logo_url || null,
          body.layout_color || "#6366f1",
          body.layout_theme || "dark",
          body.layout_font || "plusjakarta_inter",
          body.form_button_text || "Entrar no Grupo VIP Grátis",
          benefitsJson,
          testimonialsJson,
          testimonialsEnabled,
          Number(body.social_proof_count) || 0,
          body.modal_title || "Tudo pronto! 🎉",
          body.modal_description || "",
          body.modal_button_text || "Acessar Grupo VIP no WhatsApp",
          body.status === "inactive" ? "inactive" : "active",
          body.id,
          companyId
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Configurações da Landing Page salvas com sucesso!"
    });
  } catch (error: any) {
    console.error("Erro ao salvar landing page do grupo:", error);
    return NextResponse.json({ success: false, message: "Erro ao salvar dados" }, { status: 500 });
  }
}
