import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCurrentCompanyUser, getCurrentSaUser, getEffectiveCompanyId } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const groupId = parseInt(id, 10);
    if (isNaN(groupId)) {
      return NextResponse.json({ success: false, message: "ID do grupo inválido." }, { status: 400 });
    }

    const companyId = await getEffectiveCompanyId(user, request.cookies);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não associada." }, { status: 403 });
    }

    const pool = getDbPool();

    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM company_whatsapp_groups WHERE id = ? AND company_id = ?`,
      [groupId, companyId]
    );

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ success: false, message: "Grupo não encontrado." }, { status: 404 });
    }

    const oldValues = existingRows[0];
    const body = await request.json();
    const {
      name,
      whatsapp_group_id,
      description,
      group_type,
      can_send_messages,
      participants_count,
      max_capacity,
      invite_link,
      avatar_url,
      tags,
      is_admin,
      instance_id,
      status,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "O nome do grupo é obrigatório." }, { status: 400 });
    }

    await pool.query<ResultSetHeader>(
      `UPDATE company_whatsapp_groups SET
        name = ?,
        whatsapp_group_id = ?,
        description = ?,
        group_type = ?,
        can_send_messages = ?,
        participants_count = ?,
        max_capacity = ?,
        invite_link = ?,
        avatar_url = ?,
        tags = ?,
        is_admin = ?,
        instance_id = ?,
        status = ?
      WHERE id = ? AND company_id = ?`,
      [
        name.trim(),
        whatsapp_group_id?.trim() || null,
        description?.trim() || null,
        group_type || oldValues.group_type,
        can_send_messages || oldValues.can_send_messages,
        participants_count !== undefined ? parseInt(participants_count, 10) : oldValues.participants_count,
        max_capacity !== undefined ? parseInt(max_capacity, 10) : oldValues.max_capacity,
        invite_link?.trim() || null,
        avatar_url?.trim() || null,
        tags ? JSON.stringify(tags) : null,
        is_admin !== undefined ? (is_admin ? 1 : 0) : oldValues.is_admin,
        instance_id?.trim() || null,
        status || oldValues.status,
        groupId,
        companyId,
      ]
    );

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      companyId: companyId,
      action: "UPDATE",
      entityType: "company_whatsapp_groups",
      entityId: String(groupId),
      oldValues: oldValues,
      newValues: body,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "Grupo atualizado com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao atualizar grupo:", error);
    return NextResponse.json({ success: false, message: error.message || "Erro ao atualizar grupo" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const groupId = parseInt(id, 10);
    if (isNaN(groupId)) {
      return NextResponse.json({ success: false, message: "ID do grupo inválido." }, { status: 400 });
    }

    const companyId = await getEffectiveCompanyId(user, request.cookies);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não associada." }, { status: 403 });
    }

    const pool = getDbPool();

    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM company_whatsapp_groups WHERE id = ? AND company_id = ?`,
      [groupId, companyId]
    );

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ success: false, message: "Grupo não encontrado." }, { status: 404 });
    }

    const oldValues = existingRows[0];

    await pool.query<ResultSetHeader>(
      `DELETE FROM company_whatsapp_groups WHERE id = ? AND company_id = ?`,
      [groupId, companyId]
    );

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      companyId: companyId,
      action: "DELETE",
      entityType: "company_whatsapp_groups",
      entityId: String(groupId),
      oldValues: oldValues,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "Grupo removido com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao excluir grupo:", error);
    return NextResponse.json({ success: false, message: error.message || "Erro ao excluir grupo" }, { status: 500 });
  }
}
