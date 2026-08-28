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

// GET - Obter produto específico
export async function GET(
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

    const companyId = await getEffectiveCompanyId(user, request.cookies);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não associada" }, { status: 403 });
    }

    const pool = getDbPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM company_products WHERE id = ? AND company_id = ? LIMIT 1`,
      [id, companyId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Produto não encontrado" }, { status: 404 });
    }

    const p = rows[0];
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

    return NextResponse.json({
      success: true,
      product: {
        ...p,
        price: Number(p.price) || 0,
        promo_price: p.promo_price !== null ? Number(p.promo_price) : null,
        images,
        benefits,
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json({ success: false, message: error.message || "Erro ao buscar produto" }, { status: 500 });
  }
}

// PUT - Atualizar produto
export async function PUT(
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

    const companyId = await getEffectiveCompanyId(user, request.cookies);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não associada" }, { status: 403 });
    }

    const pool = getDbPool();
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id, name FROM company_products WHERE id = ? AND company_id = ? LIMIT 1`,
      [id, companyId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "Produto não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      promo_price,
      status,
      images,
      cover_image,
      layout_template,
      whatsapp_destination,
      layout_color,
      layout_theme,
      layout_font,
      cta_text,
      cta_icon,
      cta_animation,
      headline,
      guarantee_text,
      benefits,
      benefits_icon,
      offer_box_style,
      external_link,
    } = body;

    const numPrice = parseFloat(price) || 0;
    const numPromoPrice = promo_price ? parseFloat(promo_price) : null;
    const chosenCover = cover_image || (images && images.length > 0 ? images[0] : null);

    await pool.query<ResultSetHeader>(
      `UPDATE company_products SET
        name = ?,
        description = ?,
        price = ?,
        promo_price = ?,
        status = ?,
        images = ?,
        cover_image = ?,
        layout_template = ?,
        whatsapp_destination = ?,
        layout_color = ?,
        layout_theme = ?,
        layout_font = ?,
        cta_text = ?,
        cta_icon = ?,
        cta_animation = ?,
        headline = ?,
        guarantee_text = ?,
        benefits = ?,
        benefits_icon = ?,
        offer_box_style = ?,
        external_link = ?
      WHERE id = ? AND company_id = ?`,
      [
        name.trim(),
        description ? description.trim() : "",
        numPrice,
        numPromoPrice,
        status === "inactive" ? "inactive" : "active",
        JSON.stringify(images || []),
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
        JSON.stringify(benefits || []),
        benefits_icon || "check",
        offer_box_style || "model_1",
        external_link ? external_link.trim() : "",
        id,
        companyId,
      ]
    );

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: "update",
      entityType: "company_products",
      entityId: id,
      companyId: companyId,
      newValues: {
        product_id: id,
        company_id: companyId,
        name: name.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Produto atualizado com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json({ success: false, message: error.message || "Erro ao atualizar produto" }, { status: 500 });
  }
}

// DELETE - Remover produto
export async function DELETE(
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

    const companyId = await getEffectiveCompanyId(user, request.cookies);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não associada" }, { status: 403 });
    }

    const pool = getDbPool();
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, sends_count FROM company_products WHERE id = ? AND company_id = ? LIMIT 1`,
      [id, companyId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "Produto não encontrado" }, { status: 404 });
    }

    const sendsCount = Number(existing[0].sends_count) || 0;

    if (sendsCount > 0) {
      // Se houver histórico de envios, arquiva para preservar integridade
      await pool.query(
        `UPDATE company_products SET is_archived = 1, status = 'inactive' WHERE id = ? AND company_id = ?`,
        [id, companyId]
      );

      await logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        action: "archive",
        entityType: "company_products",
        entityId: id,
        companyId: companyId,
        oldValues: {
          product_id: id,
          company_id: companyId,
          name: existing[0].name,
        },
      });

      return NextResponse.json({
        success: true,
        action: "archived",
        message: "Produto arquivado com sucesso para manter o histórico de envios.",
      });
    }

    await pool.query(`DELETE FROM company_products WHERE id = ? AND company_id = ?`, [id, companyId]);

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: "delete",
      entityType: "company_products",
      entityId: id,
      companyId: companyId,
      oldValues: {
        product_id: id,
        company_id: companyId,
        name: existing[0].name,
      },
    });

    return NextResponse.json({
      success: true,
      action: "deleted",
      message: "Produto removido com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json({ success: false, message: error.message || "Erro ao excluir produto" }, { status: 500 });
  }
}
