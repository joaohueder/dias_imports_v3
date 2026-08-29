import { NextRequest, NextResponse } from "next/server";
import { requireSaPermission } from "@/lib/server-permissions";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { processActiveQueues } from "@/lib/jobs-engine";

export async function POST(req: NextRequest) {
  try {
    const isInternalDaemon = req.headers.get("x-worker-internal") === "daemon";
    if (!isInternalDaemon) {
      const auth = await requireSaPermission("workers", "edit");
      if (!auth.authorized) {
        return auth.response;
      }
    }

    const body = await req.json().catch(() => ({}));
    const queueName = body.queue_name || "all";
    const maxLimit = Math.min(20, Math.max(1, Number(body.limit) || 5));
    const pool = getDbPool();

    // Se for a fila do health monitor, executa mesmo que o DB esteja instável/offline
    if (queueName === "system-health-monitor") {
      const { processHealthMonitorJob } = await import("@/lib/jobs-engine");
      const healthResult = await processHealthMonitorJob({
        id: `health-direct-${Date.now()}`,
        queue_name: "system-health-monitor",
        name: "health_check",
        payload: { trigger: "daemon_or_manual" },
        status: "active",
        attempts: 1,
        max_attempts: 1,
        failed_reason: null,
        duration_ms: null,
        processed_at: new Date().toISOString(),
        finished_at: null,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: healthResult.success,
        processedCount: 1,
        jobs: [{ jobId: "health-monitor", name: "health_check", result: healthResult }],
      });
    }

    // Se for a fila de expiração de assinaturas, respeita o intervalo configurado
    // e mantém no máximo uma tarefa pendente dessa rotina.
    if (queueName === "cron-subscriptions") {
      const { enqueueJob, dequeueJob, processCronSubscriptionsJob } = await import("@/lib/jobs-engine");
      const [workerRows] = await pool.query<RowDataPacket[]>(
        `SELECT schedule_enabled, schedule_interval_seconds, schedule_interval_minutes
         FROM workers WHERE queue_name = ? ORDER BY created_at ASC LIMIT 1`,
        [queueName]
      );
      const worker = workerRows[0];
      const intervalSeconds = Math.max(
        15,
        Number(worker?.schedule_interval_seconds) ||
          (Number(worker?.schedule_interval_minutes) ? Number(worker.schedule_interval_minutes) * 60 : 3600)
      );

      const [existingJobs] = await pool.query<RowDataPacket[]>(
        `SELECT id, name, status, created_at, finished_at,
                TIMESTAMPDIFF(SECOND, COALESCE(finished_at, created_at), NOW()) AS elapsed_seconds
         FROM background_jobs
         WHERE queue_name = ? AND name = 'verify_subscriptions'
         ORDER BY created_at DESC LIMIT 1`,
        [queueName]
      );
      const lastJob = existingJobs[0];
      const hasPendingJob = lastJob && ["waiting", "active", "delayed"].includes(String(lastJob.status));
      const elapsedSeconds = lastJob ? Number(lastJob.elapsed_seconds) : Number.POSITIVE_INFINITY;
      const scheduleEnabled = worker?.schedule_enabled === undefined || Boolean(worker.schedule_enabled);

      if (!hasPendingJob && scheduleEnabled && elapsedSeconds >= intervalSeconds) {
        // Enfileira com trava atômica garantindo que nenhuma outra requisição simultânea crie duplicata
        const [stillPending] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM background_jobs 
           WHERE queue_name = ? AND name = 'verify_subscriptions' AND (status = 'waiting' OR status = 'active' OR created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND))
           LIMIT 1`,
          [queueName, intervalSeconds]
        );

        if (stillPending.length === 0) {
          await enqueueJob("cron-subscriptions", "verify_subscriptions", {
            action: "verify_subscriptions",
            actionLabel: "Verificar e expirar assinaturas vencidas",
            trigger: isInternalDaemon ? "daemon" : "manual",
            createdBy: isInternalDaemon ? "worker-daemon" : "sa-user",
          });
        }
      }

      const job = await dequeueJob("cron-subscriptions");
      if (job) {
        const cronResult = await processCronSubscriptionsJob(job);
        return NextResponse.json({
          success: cronResult.success,
          processedCount: 1,
          jobs: [{ jobId: job.id, name: job.name, result: cronResult }],
        });
      }

      return NextResponse.json({
        success: true,
        enqueuedCount: 0,
        processedCount: 0,
        jobs: [],
        nextRunInSeconds: Math.max(0, Math.ceil(intervalSeconds - elapsedSeconds)),
      });
    }

    // Se for o disparo de rotina periódica de sincronização de grupos WhatsApp
    if (queueName === "whatsapp-groups-sync" && body.trigger_routine === true) {
      const { enqueuePeriodicGroupSyncJobs, processActiveQueues } = await import("@/lib/jobs-engine");
      const [workerRows] = await pool.query<RowDataPacket[]>(
        `SELECT schedule_enabled, schedule_interval_seconds, schedule_interval_minutes
         FROM workers WHERE queue_name = ? ORDER BY created_at ASC LIMIT 1`,
        [queueName]
      );
      const worker = workerRows[0];
      const intervalSeconds = Math.max(
        15,
        Number(worker?.schedule_interval_seconds) ||
          (Number(worker?.schedule_interval_minutes) ? Number(worker.schedule_interval_minutes) * 60 : 300)
      );
      const scheduleEnabled = worker?.schedule_enabled === undefined || Boolean(worker.schedule_enabled);

      const [lastGroupJobs] = await pool.query<RowDataPacket[]>(
        `SELECT MAX(created_at) AS last_created_at,
                TIMESTAMPDIFF(SECOND, MAX(created_at), NOW()) AS elapsed_seconds
         FROM background_jobs
         WHERE queue_name = 'whatsapp-groups-sync'
           AND name LIKE 'sync_group_%'`
      );
      const lastGroupJob = lastGroupJobs[0];
      const elapsedSeconds = lastGroupJob?.last_created_at
        ? Number(lastGroupJob.elapsed_seconds)
        : Number.POSITIVE_INFINITY;
      const shouldEnqueue = scheduleEnabled && elapsedSeconds >= intervalSeconds;
      const routineInfo = shouldEnqueue
        ? await enqueuePeriodicGroupSyncJobs()
        : { enqueuedCount: 0, companyIds: [] as number[] };
      const cycle = await processActiveQueues("whatsapp-groups-sync", maxLimit);

      return NextResponse.json({
        success: true,
        enqueuedCount: routineInfo.enqueuedCount,
        processedCount: cycle.processedCount,
        jobs: cycle.results,
        companyIds: routineInfo.companyIds,
        nextRunInSeconds: shouldEnqueue ? intervalSeconds : Math.max(0, Math.ceil(intervalSeconds - elapsedSeconds)),
      });
    }

    const { processedCount, results } = await processActiveQueues(
      queueName === "all" ? undefined : queueName,
      maxLimit
    );

    return NextResponse.json({
      success: true,
      processedCount,
      jobs: results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao processar ciclo de jobs";
    console.error("Erro no processamento de jobs:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
