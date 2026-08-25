import { NextResponse } from "next/server";
import { requireSaPermission } from "@/lib/server-permissions";
import os from "os";

export async function GET() {
  try {
    const auth = await requireSaPermission("workers", "view");
    if (!auth.authorized) {
      return auth.response;
    }

    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptime = os.uptime();

    // Mock/Simulação estruturada com telemetria do ambiente operacional do sistema
    const workers = [
      {
        id: "w-dispatch-01",
        name: "Worker Disparador WhatsApp #01",
        description: "Envio prioritário de códigos OTP, autenticação em duas etapas e alertas críticos imediatos.",
        type: "dispatcher",
        queue: "whatsapp-messages-high",
        concurrency: 5,
        status: "active",
        processed: 1420,
        failed: 3,
        delayed: 0,
        cpu_usage: "1.2%",
        memory_usage: "48 MB",
        uptime_seconds: Math.floor(uptime % 86400),
        last_heartbeat: new Date().toISOString(),
      },
      {
        id: "w-dispatch-02",
        name: "Worker Disparador WhatsApp #02",
        description: "Disparos em massa de campanhas para grupos de WhatsApp com cadência e delay anti-ban.",
        type: "dispatcher",
        queue: "whatsapp-messages-default",
        concurrency: 10,
        status: "active",
        processed: 3890,
        failed: 12,
        delayed: 4,
        cpu_usage: "2.4%",
        memory_usage: "64 MB",
        uptime_seconds: Math.floor(uptime % 86400),
        last_heartbeat: new Date().toISOString(),
      },
      {
        id: "w-sync-01",
        name: "Worker Sincronizador de Contatos e Grupos",
        description: "Consumo de webhooks da Evolution API, atualização de participantes e confirmação de entrega.",
        type: "sync",
        queue: "evolution-webhook-sync",
        concurrency: 4,
        status: "active",
        processed: 820,
        failed: 0,
        delayed: 0,
        cpu_usage: "0.8%",
        memory_usage: "42 MB",
        uptime_seconds: Math.floor(uptime % 86400),
        last_heartbeat: new Date().toISOString(),
      },
      {
        id: "w-cron-01",
        name: "Worker Agendador e Rotinas Cron (Billing / Expirations)",
        description: "Rotinas agendadas para expiração de planos, notificações de vencimento e auditoria periódica.",
        type: "scheduler",
        queue: "cron-subscriptions",
        concurrency: 2,
        status: "idle",
        processed: 145,
        failed: 0,
        delayed: 18,
        cpu_usage: "0.1%",
        memory_usage: "36 MB",
        uptime_seconds: Math.floor(uptime % 86400),
        last_heartbeat: new Date().toISOString(),
      },
      {
        id: "w-reports-01",
        name: "Worker de Relatórios & Métricas",
        description: "Agregação de dados analíticos, consolidação de métricas e relatórios do painel.",
        type: "reports",
        queue: "analytics-aggregation",
        concurrency: 2,
        status: "paused",
        processed: 430,
        failed: 1,
        delayed: 0,
        cpu_usage: "0.0%",
        memory_usage: "28 MB",
        uptime_seconds: Math.floor(uptime % 86400),
        last_heartbeat: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
    ];

    const systemStats = {
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || "Intel/AMD Processor",
      totalMemoryMB: Math.round(totalMem / 1024 / 1024),
      usedMemoryMB: Math.round(usedMem / 1024 / 1024),
      freeMemoryMB: Math.round(freeMem / 1024 / 1024),
      systemUptime: uptime,
      redisHost: process.env.REDIS_HOST || "127.0.0.1:6379",
      redisStatus: "connected",
      totalWorkers: workers.length,
      activeWorkers: workers.filter((w) => w.status === "active").length,
      idleWorkers: workers.filter((w) => w.status === "idle").length,
      pausedWorkers: workers.filter((w) => w.status === "paused").length,
      totalProcessed: workers.reduce((acc, curr) => acc + curr.processed, 0),
      totalFailed: workers.reduce((acc, curr) => acc + curr.failed, 0),
    };

    return NextResponse.json({
      workers,
      systemStats,
    });
  } catch (error) {
    console.error("Erro ao listar workers:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar requisição de workers" },
      { status: 500 }
    );
  }
}
