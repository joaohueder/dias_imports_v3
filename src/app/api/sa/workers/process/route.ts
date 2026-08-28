import { NextRequest, NextResponse } from "next/server";
import { requireSaPermission } from "@/lib/server-permissions";
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

    // Se for a fila de expiração de assinaturas, enfileira e processa imediatamente
    if (queueName === "cron-subscriptions") {
      const { enqueueJob, dequeueJob, processCronSubscriptionsJob } = await import("@/lib/jobs-engine");
      const jobId = await enqueueJob("cron-subscriptions", "verify_subscriptions", { trigger: "daemon_or_manual" });
      const job = await dequeueJob("cron-subscriptions");
      if (job) {
        const cronResult = await processCronSubscriptionsJob(job);
        return NextResponse.json({
          success: cronResult.success,
          processedCount: 1,
          jobs: [{ jobId: job.id, name: job.name, result: cronResult }],
        });
      }
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
