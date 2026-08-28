import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const pool = getDbPool();

    // Incrementa visualização e busca produto ativo
    const isId = /^\d+$/.test(slug);
    let query = `
      SELECT p.*, c.name as company_name, c.whatsapp as company_whatsapp, c.admin_whatsapp as company_admin_whatsapp, c.phone as company_phone,
             c.meta_pixel_id, c.meta_pixel_active
      FROM company_products p
      JOIN companies c ON c.id = p.company_id
      WHERE ${isId ? "p.id = ?" : "p.slug = ?"} AND p.status = 'active'
      LIMIT 1
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [slug]);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Produto não encontrado ou inativo" }, { status: 404 });
    }

    const product = rows[0];
    const companyId = product.company_id;

    // Verificar se o limite de visualizações do plano/assinatura da empresa foi atingido
    const [subRows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.plan_snapshot_max_views, p.max_views as plan_max_views
       FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.company_id = ? AND s.status = 'active'
       ORDER BY s.id DESC
       LIMIT 1`,
      [companyId]
    );

    const activeSub = subRows[0] || null;
    const limitViews = activeSub
      ? Number(activeSub.plan_snapshot_max_views ?? activeSub.plan_max_views ?? 0)
      : 0;

    if (limitViews > 0) {
      const [viewsSumRows] = await pool.query<RowDataPacket[]>(
        `SELECT SUM(views_count) as total_views FROM company_products WHERE company_id = ?`,
        [companyId]
      );
      const totalViews = Number(viewsSumRows[0]?.total_views || 0);

      if (totalViews >= limitViews) {
        return NextResponse.json(
          {
            success: false,
            limited_view: true,
            error_code: "LIMITED_VIEW",
            message: "No momento este produto não está disponível.",
            company_name: product.company_name,
            target_whatsapp: (product.company_whatsapp || product.company_admin_whatsapp || product.company_phone || "").replace(/\D/g, ""),
          },
          { status: 403 }
        );
      }
    }

    // Incrementar views e registrar timestamp do último acesso
    pool.query(`UPDATE company_products SET views_count = views_count + 1, last_accessed_at = NOW() WHERE id = ?`, [product.id]).catch(() => {});

    let images = [];
    let benefits = [];
    try {
      images = typeof product.images === "string" ? JSON.parse(product.images) : product.images || [];
    } catch {
      images = [];
    }
    try {
      benefits = typeof product.benefits === "string" ? JSON.parse(product.benefits) : product.benefits || [];
    } catch {
      benefits = [];
    }

    // Identifica o WhatsApp de atendimento
    let targetPhone = product.company_whatsapp || product.company_admin_whatsapp || product.company_phone || "";
    if (product.whatsapp_destination && product.whatsapp_destination !== "default") {
      targetPhone = product.whatsapp_destination;
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: Number(product.price) || 0,
        promo_price: product.promo_price !== null ? Number(product.promo_price) : null,
        images,
        cover_image: product.cover_image,
        layout_template: product.layout_template || "default",
        layout_color: product.layout_color || "#6366f1",
        layout_theme: product.layout_theme || "dark",
        layout_font: product.layout_font || "sans_modern",
        cta_text: product.cta_text || "Comprar no WhatsApp",
        cta_icon: product.cta_icon || "arrow-right",
        cta_animation: product.cta_animation || "none",
        headline: product.headline,
        guarantee_text: product.guarantee_text,
        benefits,
        benefits_icon: product.benefits_icon || "check",
        offer_box_style: product.offer_box_style || "model_1",
        external_link: product.external_link,
        company_name: product.company_name,
        target_whatsapp: targetPhone.replace(/\D/g, ""),
        meta_pixel_id: Boolean(product.meta_pixel_active) && product.meta_pixel_id ? product.meta_pixel_id : null,
        meta_pixel_active: Boolean(product.meta_pixel_active),
      },
    });
  } catch (error: any) {
    console.error("Erro na landing page do produto:", error);
    return NextResponse.json({ success: false, message: "Erro ao carregar produto" }, { status: 500 });
  }
}
