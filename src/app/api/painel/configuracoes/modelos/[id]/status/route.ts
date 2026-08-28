import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// PATCH - Alternar status (active/inactive) do modelo de mensagem
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateId = parseInt(id, 10);
    if (!templateId) {
      return NextResponse.json({ success: false, message: "ID inválido." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const impersonateCompanyId = cookieStore.get("company_id")?.value;

    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado." }, { status: 401 });
    }

    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);
    const body = await request.json().catch(() => ({}));
    const pool = getDbPool();

    // Verifica se o modelo existe e pertence à empresa
    const [check] = await pool.query<RowDataPacket[]>(
      `SELECT id, status, title FROM company_message_templates WHERE id = ? AND company_id = ?`,
      [templateId, companyId]
    );

    if (check.length === 0) {
      return NextResponse.json({ success: false, message: "Modelo não encontrado." }, { status: 404 });
    }

    const currentStatus = check[0].status || "active";
    let newStatus: "active" | "inactive";

    if (body.status && (body.status === "active" || body.status === "inactive")) {
      newStatus = body.status;
    } else {
      newStatus = currentStatus === "active" ? "inactive" : "active";
    }

    await pool.query(
      `UPDATE company_message_templates SET status = ?, updated_at = NOW() WHERE id = ? AND company_id = ?`,
      [newStatus, templateId, companyId]
    );

    return NextResponse.json({
      success: true,
      message: `Modelo ${newStatus === "active" ? "ativado" : "desativado"} com sucesso!`,
      status: newStatus,
    });
  } catch (error: any) {
    console.error("Erro ao alternar status do modelo:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao alternar status." },
      { status: 500 }
    );
  }
}
