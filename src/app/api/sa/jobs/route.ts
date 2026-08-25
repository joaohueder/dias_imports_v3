import { NextResponse } from "next/server";
import { requireSaPermission } from "@/lib/server-permissions";

export async function GET() {
  try {
    const auth = await requireSaPermission("jobs", "view");
    if (!auth.authorized) {
      return auth.response;
    }

    // Mock estruturado de Filas BullMQ e Tarefas do ecossistema
    const queues = [
      {
        id: "q-messages-high",
        name: "whatsapp-messages-high",
        description: "Envio de OTP, notificações críticas e disparos prioritários",
        waiting: 0,
        active: 2,
        completed: 18420,
        failed: 4,
        delayed: 0,
        paused: false,
      },
      {
        id: "q-messages-default",
        name: "whatsapp-messages-default",
        description: "Envio em massa e campanhas de marketing em grupos",
        waiting: 14,
        active: 8,
        completed: 94250,
        failed: 38,
        delayed: 120,
        paused: false,
      },
      {
        id: "q-webhook-sync",
        name: "evolution-webhook-sync",
        description: "Sincronização de webhooks, status de entrega e leitura",
        waiting: 1,
        active: 3,
        completed: 31200,
        failed: 2,
        delayed: 0,
        paused: false,
      },
      {
        id: "q-cron-subscriptions",
        name: "cron-subscriptions",
        description: "Verificação de vencimento de assinaturas e expirações",
        waiting: 0,
        active: 0,
        completed: 1450,
        failed: 0,
        delayed: 1,
        paused: false,
      },
    ];

    const recentJobs = [
      {
        id: "job-8921",
        queue: "whatsapp-messages-high",
        name: "send-otp-auth",
        data: { phone: "5511999887766", template: "login_otp" },
        status: "completed",
        attempts: 1,
        processedOn: new Date(Date.now() - 1000 * 30).toISOString(),
        finishedOn: new Date(Date.now() - 1000 * 28).toISOString(),
        duration_ms: 2150,
      },
      {
        id: "job-8920",
        queue: "whatsapp-messages-default",
        name: "dispatch-campaign-message",
        data: { campaignId: "camp_001", recipient: "5511988887777" },
        status: "active",
        attempts: 1,
        processedOn: new Date(Date.now() - 1000 * 5).toISOString(),
        finishedOn: null,
        duration_ms: null,
      },
      {
        id: "job-8919",
        queue: "evolution-webhook-sync",
        name: "sync-group-participants",
        data: { groupId: "120363028392@g.us", count: 180 },
        status: "completed",
        attempts: 1,
        processedOn: new Date(Date.now() - 1000 * 90).toISOString(),
        finishedOn: new Date(Date.now() - 1000 * 88).toISOString(),
        duration_ms: 1840,
      },
      {
        id: "job-8918",
        queue: "whatsapp-messages-default",
        name: "dispatch-campaign-message",
        data: { campaignId: "camp_001", recipient: "5511977776666" },
        status: "failed",
        attempts: 3,
        failedReason: "Connection closed by peer / Timeout",
        processedOn: new Date(Date.now() - 1000 * 300).toISOString(),
        finishedOn: new Date(Date.now() - 1000 * 290).toISOString(),
        duration_ms: 9800,
      },
    ];

    const stats = {
      totalQueues: queues.length,
      totalWaiting: queues.reduce((acc, q) => acc + q.waiting, 0),
      totalActive: queues.reduce((acc, q) => acc + q.active, 0),
      totalCompleted: queues.reduce((acc, q) => acc + q.completed, 0),
      totalFailed: queues.reduce((acc, q) => acc + q.failed, 0),
      totalDelayed: queues.reduce((acc, q) => acc + q.delayed, 0),
    };

    return NextResponse.json({
      queues,
      recentJobs,
      stats,
    });
  } catch (error) {
    console.error("Erro ao listar jobs da central de tarefas:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar requisição de tarefas" },
      { status: 500 }
    );
  }
}
