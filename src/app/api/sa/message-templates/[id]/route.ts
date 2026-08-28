import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { requireSaPermission } from "@/lib/server-permissions";
import { logAudit } from "@/lib/audit";

// PUT /api/sa/message-templates/[id] - Edita um modelo mestre
export async function PUT(
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
    const { title, content, type, status } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Conteúdo da mensagem é obrigatório" }, { status: 400 });
    }

    const validTypes = ["standard", "offer", "urgency", "custom"];
    const templateType = validTypes.includes(type) ? type : "standard";
    const templateStatus = status === "inactive" ? "inactive" : "active";

    const [result]: any = await pool.query(
      "UPDATE sa_message_templates SET title = ?, content = ?, type = ?, status = ? WHERE id = ?",
      [title.trim(), content.trim(), templateType, templateStatus, templateId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });
    }

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userEmail: auth.user.email,
      userRole: auth.user.role,
      action: "UPDATE_SA_MESSAGE_TEMPLATE",
      entityType: "sa_message_templates",
      entityId: templateId,
      newValues: { id: templateId, title: title.trim(), type: templateType, status: templateStatus },
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Modelo mestre atualizado com sucesso" });
  } catch (error: any) {
    console.error("Erro ao atualizar modelo mestre:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// DELETE /api/sa/message-templates/[id] - Exclui um modelo mestre
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("message_templates", "delete");
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;
    const templateId = parseInt(id, 10);
    if (!templateId || isNaN(templateId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const pool = getDbPool();
    const [result]: any = await pool.query(
      "DELETE FROM sa_message_templates WHERE id = ?",
      [templateId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });
    }

    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userEmail: auth.user.email,
      userRole: auth.user.role,
      action: "DELETE_SA_MESSAGE_TEMPLATE",
      entityType: "sa_message_templates",
      entityId: templateId,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Modelo mestre excluído com sucesso" });
  } catch (error: any) {
    console.error("Erro ao excluir modelo mestre:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
