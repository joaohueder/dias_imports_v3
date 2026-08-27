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
