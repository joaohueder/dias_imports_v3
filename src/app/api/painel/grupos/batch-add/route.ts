import { NextRequest, NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
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
    const { groups, instance_id } = body;

    if (!Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nenhum grupo selecionado para importação." },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // 1. Obter grupos existentes para evitar duplicação pelo JID (whatsapp_group_id)
    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT whatsapp_group_id FROM company_whatsapp_groups WHERE company_id = ?`,
      [companyId]
    );
    const existingJids = new Set(existingRows.map((r) => r.whatsapp_group_id).filter(Boolean));

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of groups) {
      const jid = item.jid || item.id || "";
      const name = item.name || item.subject || "Grupo WhatsApp";
      const description = item.description || null;
      const participantsCount = parseInt(item.participants_count, 10) || 0;
      const avatarUrl = item.picture_url || item.avatar_url || null;
      const canSendMessages = item.announce ? "admin_only" : "all";
      const groupType = item.group_type || "offers";
      const status = "active"; // Status Ativo

      if (jid && existingJids.has(jid)) {
        // Atualiza grupo existente para active se necessário ou pula
        skippedCount++;
        continue;
      }

      const [insertRes] = await pool.query<ResultSetHeader>(
        `INSERT INTO company_whatsapp_groups (
          company_id, whatsapp_group_id, name, description, group_type,
          can_send_messages, participants_count, max_capacity, invite_link,
          avatar_url, tags, is_admin, instance_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          companyId,
          jid || null,
          name,
          description,
          groupType,
          canSendMessages,
          participantsCount,
          1024,
          null,
          avatarUrl,
          JSON.stringify(["importado-instancia"]),
          1,
          instance_id ? String(instance_id) : null,
          status,
        ]
      );

      const newGroupId = insertRes.insertId;

      // Enfileira 1 tarefa individual na fila para cada grupo adicionado
      try {
        const { enqueueJob } = await import("@/lib/jobs-engine");
        await enqueueJob(
          "evolution-webhook-sync",
          `sync_group_${jid || newGroupId}`,
          {
            company_id: companyId,
            group_id: newGroupId,
            whatsapp_group_id: jid,
            group_name: name,
            instance_id: instance_id || null,
            created_by: user.id,
          },
          3
        );
      } catch (queueErr) {
        console.warn(`[batch-add] Não foi possível enfileirar o job para o grupo ${name}:`, queueErr);
      }

      insertedCount++;
    }

    // Registra log de auditoria
    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      companyId: companyId,
      action: "BATCH_IMPORT",
      entityType: "company_whatsapp_groups",
      entityId: `${insertedCount}_groups`,
      newValues: { count: insertedCount, status: "sync_pending" },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `${insertedCount} ${insertedCount === 1 ? "grupo adicionado" : "grupos adicionados"} com status 'Aguardando sincronização'.`,
      inserted_count: insertedCount,
      skipped_count: skippedCount,
    });
  } catch (error: any) {
    console.error("Erro ao importar grupos em lote:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao adicionar grupos selecionados." },
      { status: 500 }
    );
  }
}
