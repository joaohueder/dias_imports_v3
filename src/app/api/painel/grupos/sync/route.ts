import { NextRequest, NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { getEvolutionConfig } from "@/lib/evolution";
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

    const pool = getDbPool();

    // 1. Obter grupos cadastrados para a empresa
    const [savedGroups] = await pool.query<RowDataPacket[]>(
      `SELECT id, whatsapp_group_id, name, status, instance_id FROM company_whatsapp_groups WHERE company_id = ?`,
      [companyId]
    );

    if (savedGroups.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum grupo cadastrado para sincronizar.",
        enqueuedCount: 0,
      });
    }

    // 2. Enfileirar 1 tarefa individual por grupo na fila dedicada de sincronização de grupos
    const { enqueueJob } = await import("@/lib/jobs-engine");
    const jobIds: string[] = [];
    let skippedCount = 0;

    for (const group of savedGroups) {
      const jobName = `sync_group_${group.whatsapp_group_id || group.id}`;
      const [pendingJobs] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM background_jobs
         WHERE queue_name = 'whatsapp-groups-sync'
           AND name = ?
           AND status IN ('waiting', 'active', 'delayed')
         LIMIT 1`,
        [jobName]
      );
      if (pendingJobs.length > 0) {
        skippedCount++;
        continue;
      }

      const jobId = await enqueueJob(
        "whatsapp-groups-sync",
        jobName,
        {
          company_id: companyId,
          group_id: group.id,
          whatsapp_group_id: group.whatsapp_group_id,
          group_name: group.name,
          action: "sync_group",
          trigger: "manual",
          requested_by: user.id,
          requested_at: new Date().toISOString(),
        },
        3
      );
      jobIds.push(jobId);
    }

    // Registra log de auditoria
    await logAudit({
      userId: user.id,
      companyId: companyId,
      action: "ENQUEUE_SYNC_WHATSAPP_GROUPS_INDIVIDUAL",
      entityType: "company_whatsapp_groups",
      entityId: `${jobIds.length}_jobs`,
      newValues: {
        total_groups: savedGroups.length,
        total_jobs_enqueued: jobIds.length,
        total_jobs_skipped_pending: skippedCount,
        queue: "whatsapp-groups-sync",
        job_ids: jobIds,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${jobIds.length} ${jobIds.length === 1 ? "tarefa foi enviada" : "tarefas individuais foram enviadas"} para a fila de execução.`,
      enqueuedCount: jobIds.length,
      jobIds,
    });
  } catch (error: any) {
    console.error("[Sync Groups Route] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno ao sincronizar os grupos com o WhatsApp.",
      },
      { status: 500 }
    );
  }
}
