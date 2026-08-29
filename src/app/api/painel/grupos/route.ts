import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCurrentCompanyUser, getCurrentSaUser, getEffectiveCompanyId } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const groupType = searchParams.get("group_type") || "all";

    const companyId = await getEffectiveCompanyId(user, request.cookies);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não associada" }, { status: 403 });
    }

    const pool = getDbPool();

    let query = `
      SELECT id, company_id, whatsapp_group_id, name, description, group_type,
             can_send_messages, participants_count, max_capacity, invite_link,
             avatar_url, tags, is_admin, instance_id, status, created_at, updated_at
      FROM company_whatsapp_groups
      WHERE company_id = ?
    `;
    const params: any[] = [companyId];

    if (search) {
      query += ` AND (name LIKE ? OR description LIKE ? OR whatsapp_group_id LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status !== "all") {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (groupType !== "all") {
      if (groupType === "closed") {
        query += ` AND (group_type = 'closed' OR can_send_messages = 'admin_only' OR can_send_messages = 'admin')`;
      } else if (groupType === "open") {
        query += ` AND (group_type != 'closed' AND can_send_messages != 'admin_only' AND can_send_messages != 'admin')`;
      } else {
        query += ` AND group_type = ?`;
        params.push(groupType);
      }
    }

    query += ` ORDER BY id DESC`;

    // Executa consultas em paralelo para acelerar resposta da tela
    const [[rows], [metricsRows], [subRows]] = await Promise.all([
      pool.query<RowDataPacket[]>(query, params),
      pool.query<RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total_groups,
          COALESCE(SUM(participants_count), 0) as total_participants,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_groups,
          SUM(CASE WHEN can_send_messages = 'admin_only' THEN 1 ELSE 0 END) as closed_groups
         FROM company_whatsapp_groups
         WHERE company_id = ?`,
        [companyId]
      ),
      pool.query<RowDataPacket[]>(
        `SELECT s.id, s.plan_snapshot_max_groups, p.max_groups as plan_max_groups
         FROM subscriptions s
         LEFT JOIN plans p ON s.plan_id = p.id
         WHERE s.company_id = ? AND s.status = 'active'
         ORDER BY s.id DESC
         LIMIT 1`,
        [companyId]
      ),
    ]);

    const metrics = metricsRows[0] || {
      total_groups: 0,
      total_participants: 0,
      active_groups: 0,
      closed_groups: 0,
    };

    const activeSub = subRows[0] || null;
    const limitGroups = activeSub
      ? Number(activeSub.plan_snapshot_max_groups ?? activeSub.plan_max_groups ?? 0)
      : 0;

    return NextResponse.json({
      success: true,
      groups: rows,
      metrics: {
        total_groups: Number(metrics.total_groups) || 0,
        total_participants: Number(metrics.total_participants) || 0,
        active_groups: Number(metrics.active_groups) || 0,
        closed_groups: Number(metrics.closed_groups) || 0,
        limit_groups: limitGroups,
      },
    });
  } catch (error: any) {
    console.error("Erro ao listar grupos:", error);
    return NextResponse.json({ success: false, message: error.message || "Erro ao listar grupos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const {
      name,
      whatsapp_group_id,
      description,
      group_type = "offers",
      can_send_messages = "admin_only",
      participants_count = 0,
      max_capacity = 1024,
      invite_link,
      avatar_url,
      tags = [],
      is_admin = true,
      instance_id,
      status = "active",
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "O nome do grupo é obrigatório." }, { status: 400 });
    }

    const pool = getDbPool();

    // Validação de assinatura ativa e limites de grupos
    const [subRows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.plan_snapshot_max_groups, p.max_groups as plan_max_groups
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
          message: "Sua empresa não possui uma assinatura ativa. Ative um plano para adicionar e monitorar grupos de WhatsApp.",
        },
        { status: 403 }
      );
    }

    const limitGroups = Number(activeSub.plan_snapshot_max_groups ?? activeSub.plan_max_groups ?? 0);

    if (limitGroups > 0) {
      const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM company_whatsapp_groups WHERE company_id = ?`,
        [companyId]
      );
      const currentTotal = Number(countRows[0]?.total || 0);
      if (currentTotal >= limitGroups) {
        return NextResponse.json(
          {
            success: false,
            limit_reached: true,
            message: `Limite de grupos atingido (${currentTotal}/${limitGroups}). Faça um upgrade do seu plano para gerenciar e disparar para mais grupos no WhatsApp!`,
          },
          { status: 403 }
        );
      }
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO company_whatsapp_groups (
        company_id, whatsapp_group_id, name, description, group_type,
        can_send_messages, participants_count, max_capacity, invite_link,
        avatar_url, tags, is_admin, instance_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        whatsapp_group_id?.trim() || null,
        name.trim(),
        description?.trim() || null,
        group_type,
        can_send_messages,
        parseInt(participants_count, 10) || 0,
        parseInt(max_capacity, 10) || 1024,
        invite_link?.trim() || null,
        avatar_url?.trim() || null,
        tags && tags.length > 0 ? JSON.stringify(tags) : null,
        is_admin ? 1 : 0,
        instance_id?.trim() || null,
        status,
      ]
    );

    const newGroupId = result.insertId;

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      companyId: companyId,
      action: "CREATE",
      entityType: "company_whatsapp_groups",
      entityId: String(newGroupId),
      newValues: { id: newGroupId, name, group_type, status },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "Grupo cadastrado com sucesso!",
      group_id: newGroupId,
    });
  } catch (error: any) {
    console.error("Erro ao criar grupo:", error);
    return NextResponse.json({ success: false, message: error.message || "Erro ao cadastrar grupo" }, { status: 500 });
  }
}
