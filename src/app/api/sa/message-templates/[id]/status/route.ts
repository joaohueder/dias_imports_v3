import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { requireSaPermission } from "@/lib/server-permissions";
import { logAudit } from "@/lib/audit";

// PATCH /api/sa/message-templates/[id]/status - Alterna status active/inactive
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("message_templates", "edit");
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;
    const templateId = parseInt(id, 10);
    if (!templateId || isNaN(templateId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const pool = getDbPool();
    const body = await req.json();
    const { status } = body;

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const [result]: any = await pool.query(
      "UPDATE sa_message_templates SET status = ? WHERE id = ?",
      [status, templateId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });
    }

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userEmail: auth.user.email,
      userRole: auth.user.role,
      action: "TOGGLE_SA_MESSAGE_TEMPLATE_STATUS",
      entityType: "sa_message_templates",
      entityId: templateId,
      newValues: { status },
      status: "success",
    });

    return NextResponse.json({ success: true, message: `Status alterado para ${status}` });
  } catch (error: any) {
    console.error("Erro ao alterar status do modelo mestre:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
