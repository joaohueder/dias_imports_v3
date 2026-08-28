import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

export async function PATCH(
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

    const body = await request.json();
    const { status, is_archived } = body;

    const pool = getDbPool();
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, status, is_archived FROM company_products WHERE id = ? AND company_id = ? LIMIT 1`,
      [id, companyId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "Produto não encontrado." }, { status: 404 });
    }

    if (is_archived !== undefined) {
      const archivedVal = is_archived ? 1 : 0;
      await pool.query<ResultSetHeader>(
        `UPDATE company_products SET is_archived = ?, status = ? WHERE id = ? AND company_id = ?`,
        [archivedVal, archivedVal ? "inactive" : "active", id, companyId]
      );

      await logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        action: is_archived ? "archive" : "unarchive",
        entityType: "company_products",
        entityId: id,
        companyId: companyId,
        oldValues: { is_archived: existing[0].is_archived },
        newValues: { is_archived: archivedVal },
      });

      return NextResponse.json({
        success: true,
        message: is_archived ? "Produto arquivado com sucesso." : "Produto desarquivado com sucesso.",
      });
    }

    if (!status || !["active", "inactive"].includes(status)) {
      return NextResponse.json({ success: false, message: "Status inválido." }, { status: 400 });
    }

    await pool.query<ResultSetHeader>(
      `UPDATE company_products SET status = ? WHERE id = ? AND company_id = ?`,
      [status, id, companyId]
    );

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: "update_status",
      entityType: "company_products",
      entityId: id,
      companyId: companyId,
      oldValues: { status: existing[0].status },
      newValues: { status: status },
    });

    return NextResponse.json({
      success: true,
      message: `Status do produto atualizado para ${status === "active" ? "Ativo" : "Inativo"}.`,
    });
  } catch (error: any) {
    console.error("Erro ao alterar status do produto:", error);
    return NextResponse.json({ success: false, message: error.message || "Erro ao alterar status" }, { status: 500 });
  }
}
