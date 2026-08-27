import { NextRequest, NextResponse } from "next/server";
import { requireSaPermission } from "@/lib/server-permissions";
import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const auth = await requireSaPermission("jobs", "view");
    if (!auth.authorized) {
      return auth.response;
    }

    const pool = getDbPool();

    // Garante que as tabelas de queues e jobs existam antes de consultar
    await pool.query(`
      CREATE TABLE IF NOT EXISTS queues (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL UNIQUE,
        description TEXT NULL,
        is_paused TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS background_jobs (
        id VARCHAR(64) PRIMARY KEY,
        queue_name VARCHAR(128) NOT NULL,
        name VARCHAR(128) NOT NULL,
        payload JSON NULL,
        status ENUM('waiting', 'active', 'completed', 'failed', 'delayed') NOT NULL DEFAULT 'waiting',
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 3,
        failed_reason TEXT NULL,
        duration_ms INT NULL,
        processed_at DATETIME NULL,
        finished_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_queue_status (queue_name, status),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Insere filas padrão se vazias
    await pool.query(`
      INSERT IGNORE INTO queues (id, name, description, is_paused) VALUES
      ('q-messages-high', 'whatsapp-messages-high', 'Envio de OTP, autenticação e notificações críticas prioritárias', 0),
      ('q-messages-default', 'whatsapp-messages-default', 'Disparos em massa de campanhas para grupos de WhatsApp com delay anti-ban', 0),
      ('q-webhook-sync', 'evolution-webhook-sync', 'Sincronização de webhooks da Evolution API v2.3.7 e status de entrega', 0),
      ('q-cron-subscriptions', 'cron-subscriptions', 'Rotinas periódicas de verificação de assinaturas e expirações', 0),
      ('q-analytics', 'analytics-aggregation', 'Agregação analítica e consolidação de métricas do sistema', 0);
    `);

    // 1. Busca todas as filas cadastradas e métricas dinâmicas reais
    const [queueRows] = await pool.execute<RowDataPacket[]>(
      `SELECT q.*, 
        COUNT(CASE WHEN j.status = 'waiting' THEN 1 END) as \`waiting\`,
        COUNT(CASE WHEN j.status = 'active' THEN 1 END) as \`active\`,
        COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as \`completed\`,
        COUNT(CASE WHEN j.status = 'failed' THEN 1 END) as \`failed\`,
        COUNT(CASE WHEN j.status = 'delayed' THEN 1 END) as \`delayed\`
       FROM queues q
       LEFT JOIN background_jobs j ON j.queue_name = q.name
       GROUP BY q.id, q.name, q.description, q.is_paused, q.created_at, q.updated_at
       ORDER BY q.created_at ASC`
    );

    // Auto-processa tarefas pendentes em background de forma assíncrona
    const hasWaitingJobs = queueRows.some((q) => Number(q.waiting || 0) > 0);
    if (hasWaitingJobs) {
      import("@/lib/jobs-engine").then(({ processActiveQueues }) => {
        processActiveQueues(undefined, 5).catch((err) => {
          console.warn("Aviso no auto-processamento de filas:", err);
        });
      });
    }

    // 2. Busca histórico das tarefas recentes persistidas
    const [jobRows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM background_jobs ORDER BY created_at DESC LIMIT 50`
    );

    const queues = queueRows.map((q) => ({
      id: q.id,
      name: q.name,
      description: q.description || "",
      waiting: Number(q.waiting || 0),
      active: Number(q.active || 0),
      completed: Number(q.completed || 0),
      failed: Number(q.failed || 0),
      delayed: Number(q.delayed || 0),
      paused: Boolean(q.is_paused),
    }));

    const recentJobs = jobRows.map((j) => ({
      id: j.id,
      queue: j.queue_name,
      name: j.name,
      data: typeof j.payload === "string" ? JSON.parse(j.payload || "{}") : j.payload || {},
      status: j.status,
      attempts: j.attempts,
      max_attempts: j.max_attempts,
      failedReason: j.failed_reason,
      duration_ms: j.duration_ms,
      processedOn: j.processed_at,
      finishedOn: j.finished_at,
      createdAt: j.created_at,
    }));

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
  } catch (error: any) {
    console.error("Erro ao listar jobs da central de tarefas:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao processar requisição de tarefas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSaPermission("jobs", "create");
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { action, jobId, queueName, jobName, payload } = body;

    const pool = getDbPool();

    // Reenfileirar / Retentar Job que falhou
    if (action === "retry" && jobId) {
      await pool.execute<ResultSetHeader>(
        `UPDATE background_jobs 
         SET status = 'waiting', failed_reason = NULL, duration_ms = NULL, processed_at = NULL, finished_at = NULL
         WHERE id = ?`,
        [jobId]
      );

      // Dispara o processamento imediato em background
      import("@/lib/jobs-engine").then(({ processActiveQueues }) => {
        processActiveQueues(undefined, 5).catch((err) => {
          console.warn("Aviso ao auto-processar retry:", err);
        });
      });

      return NextResponse.json({
        success: true,
        message: `Tarefa #${jobId} reenfileirada para reprocessamento com sucesso.`,
      });
    }

    // Criar nova tarefa teste / manual
    if (action === "create" && queueName && jobName) {
      const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await pool.execute<ResultSetHeader>(
        `INSERT INTO background_jobs (id, queue_name, name, payload, status, attempts, max_attempts, created_at)
         VALUES (?, ?, ?, ?, 'waiting', 0, 3, NOW())`,
        [id, queueName, jobName, JSON.stringify(payload || {})]
      );

      // Dispara o processamento imediato em background
      import("@/lib/jobs-engine").then(({ processActiveQueues }) => {
        processActiveQueues(queueName, 5).catch((err) => {
          console.warn("Aviso ao auto-processar novo job:", err);
        });
      });

      return NextResponse.json({
        success: true,
        message: `Tarefa #${id} adicionada à fila '${queueName}' com sucesso.`,
        jobId: id,
      });
    }

    // Limpar tarefas concluídas
    if (action === "purge_completed") {
      await pool.execute<ResultSetHeader>(
        `DELETE FROM background_jobs WHERE status = 'completed'`
      );

      return NextResponse.json({
        success: true,
        message: "Histórico de tarefas concluídas limpo com sucesso.",
      });
    }

    return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  } catch (error) {
    console.error("Erro na ação de tarefas:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar ação na central de tarefas" },
      { status: 500 }
    );
  }
}
