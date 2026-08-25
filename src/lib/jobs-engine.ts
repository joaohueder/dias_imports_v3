import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface QueueRecord {
  id: string;
  name: string;
  description: string | null;
  is_paused: boolean;
}

export interface JobRecord {
  id: string;
  queue_name: string;
  name: string;
  payload: Record<string, unknown> | null;
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  attempts: number;
  max_attempts: number;
  failed_reason: string | null;
  duration_ms: number | null;
  processed_at: string | null;
  finished_at: string | null;
  created_at: string;
}

/**
 * Cria ou enfileira um novo background job no banco de dados
 */
export async function enqueueJob(
  queueName: string,
  jobName: string,
  payload: Record<string, unknown> = {},
  maxAttempts: number = 3
): Promise<string> {
  const pool = getDbPool();
  const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  await pool.execute<ResultSetHeader>(
    `INSERT INTO background_jobs (id, queue_name, name, payload, status, attempts, max_attempts, created_at)
     VALUES (?, ?, ?, ?, 'waiting', 0, ?, NOW())`,
    [id, queueName, jobName, JSON.stringify(payload), maxAttempts]
  );

  return id;
}

/**
 * Puxa o próximo job pendente da fila para processamento (lock otimista)
 */
export async function dequeueJob(queueName: string): Promise<JobRecord | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM background_jobs 
     WHERE queue_name = ? AND status = 'waiting'
     ORDER BY created_at ASC LIMIT 1`,
    [queueName]
  );

  if (!rows.length) return null;
  const job = rows[0];

  await pool.execute<ResultSetHeader>(
    `UPDATE background_jobs 
     SET status = 'active', attempts = attempts + 1, processed_at = NOW() 
     WHERE id = ? AND status = 'waiting'`,
    [job.id]
  );

  return {
    id: job.id,
    queue_name: job.queue_name,
    name: job.name,
    payload: typeof job.payload === "string" ? JSON.parse(job.payload) : job.payload,
    status: "active",
    attempts: job.attempts + 1,
    max_attempts: job.max_attempts,
    failed_reason: job.failed_reason,
    duration_ms: job.duration_ms,
    processed_at: new Date().toISOString(),
    finished_at: null,
    created_at: job.created_at,
  };
}

/**
 * Conclui um job com sucesso
 */
export async function completeJob(id: string, durationMs: number): Promise<void> {
  const pool = getDbPool();
  await pool.execute<ResultSetHeader>(
    `UPDATE background_jobs 
     SET status = 'completed', duration_ms = ?, finished_at = NOW() 
     WHERE id = ?`,
    [durationMs, id]
  );
}

/**
 * Marca um job como falha ou retenta
 */
export async function failJob(id: string, reason: string, durationMs?: number): Promise<void> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT attempts, max_attempts FROM background_jobs WHERE id = ?`,
    [id]
  );

  if (rows.length > 0 && rows[0].attempts < rows[0].max_attempts) {
    // Reenfileira como delayed
    await pool.execute<ResultSetHeader>(
      `UPDATE background_jobs 
       SET status = 'delayed', failed_reason = ?, duration_ms = ? 
       WHERE id = ?`,
      [reason, durationMs || null, id]
    );
  } else {
    // Falha definitiva
    await pool.execute<ResultSetHeader>(
      `UPDATE background_jobs 
       SET status = 'failed', failed_reason = ?, duration_ms = ?, finished_at = NOW() 
       WHERE id = ?`,
      [reason, durationMs || null, id]
    );
  }
}
