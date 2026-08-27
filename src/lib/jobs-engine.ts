import { getDbPool } from "@/lib/db";
import { sendEvolutionText } from "@/lib/evolution";
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

export interface WorkerConfig {
  id: string;
  name: string;
  queue_name: string;
  concurrency: number;
  min_delay_seconds: number;
  max_delay_seconds: number;
  batch_size: number;
  batch_pause_seconds: number;
  status: "active" | "idle" | "paused" | "stopped";
}

const instanceNextAvailableMap = new Map<string, number>();
const instanceSentCountMap = new Map<string, number>();

/**
 * Utilitário de espera assíncrona
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calcula delay randômico em milissegundos respeitando a janela mínima e máxima
 */
export function calculateRandomDelayMs(minSeconds: number, maxSeconds: number): number {
  const min = Math.max(0, Number(minSeconds) || 0);
  const max = Math.max(min, Number(maxSeconds) || min);
  const randomSec = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomSec * 1000;
}

/**
 * Garante e sincroniza a espera por instância antes de executar a ação na Evolution API
 */
export async function scheduleInstanceDelay(
  instanceKey: string,
  minSeconds: number,
  maxSeconds: number,
  batchSize: number = 10,
  batchPauseSeconds: number = 30
): Promise<{ waitedMs: number; isBatchPause: boolean }> {
  const now = Date.now();
  const currentAvailable = instanceNextAvailableMap.get(instanceKey) || now;
  const sentCount = (instanceSentCountMap.get(instanceKey) || 0) + 1;
  instanceSentCountMap.set(instanceKey, sentCount);

  let isBatchPause = false;
  let delayMs = calculateRandomDelayMs(minSeconds, maxSeconds);

  if (batchSize > 0 && sentCount % batchSize === 0) {
    isBatchPause = true;
    delayMs += Math.max(0, batchPauseSeconds) * 1000;
  }

  const startTime = Math.max(now, currentAvailable);
  const targetExecTime = startTime + delayMs;
  instanceNextAvailableMap.set(instanceKey, targetExecTime);

  const waitMs = targetExecTime - now;
  if (waitMs > 0) {
    await sleep(waitMs);
  }

  return { waitedMs: waitMs, isBatchPause };
}

/**
 * Busca configurações ativas de worker vinculadas à fila
 */
export async function getWorkerConfigByQueue(queueName: string): Promise<WorkerConfig | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, name, queue_name, concurrency, min_delay_seconds, max_delay_seconds, batch_size, batch_pause_seconds, status
     FROM workers
     WHERE queue_name = ?
     ORDER BY created_at ASC
     LIMIT 1`,
    [queueName]
  );

  if (!rows.length) return null;
  const w = rows[0];
  return {
    id: w.id,
    name: w.name,
    queue_name: w.queue_name,
    concurrency: Number(w.concurrency) || 1,
    min_delay_seconds: Number(w.min_delay_seconds) || 3,
    max_delay_seconds: Number(w.max_delay_seconds) || 15,
    batch_size: Number(w.batch_size) || 10,
    batch_pause_seconds: Number(w.batch_pause_seconds) || 30,
    status: w.status,
  };
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
 * Puxa o próximo job pendente da fila para processamento (waiting ou delayed para retentativa)
 */
export async function dequeueJob(queueName: string): Promise<JobRecord | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM background_jobs 
     WHERE queue_name = ? AND (status = 'waiting' OR status = 'delayed')
     ORDER BY created_at ASC LIMIT 1`,
    [queueName]
  );

  if (!rows.length) return null;
  const job = rows[0];

  const [updateResult] = await pool.execute<ResultSetHeader>(
    `UPDATE background_jobs 
     SET status = 'active', attempts = attempts + 1
     WHERE id = ? AND (status = 'waiting' OR status = 'delayed')`,
    [job.id]
  );

  if (updateResult.affectedRows === 0) {
    return null;
  }

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
    processed_at: null,
    finished_at: null,
    created_at: job.created_at,
  };
}

/**
 * Conclui um job com sucesso e atualiza contadores do worker
 */
export async function completeJob(id: string, durationMs: number, queueName?: string): Promise<void> {
  const pool = getDbPool();
  await pool.execute<ResultSetHeader>(
    `UPDATE background_jobs 
     SET status = 'completed', duration_ms = ?, processed_at = NOW(), finished_at = NOW() 
     WHERE id = ?`,
    [durationMs, id]
  );

  if (queueName) {
    await pool.execute(
      `UPDATE workers 
       SET processed_count = processed_count + 1, last_heartbeat_at = NOW() 
       WHERE queue_name = ?`,
      [queueName]
    );
  }
}

/**
 * Marca um job como falha ou retenta atualizando contadores do worker
 */
export async function failJob(id: string, reason: string, durationMs?: number, queueName?: string): Promise<void> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT attempts, max_attempts FROM background_jobs WHERE id = ?`,
    [id]
  );

  if (rows.length > 0 && rows[0].attempts < rows[0].max_attempts) {
    await pool.execute<ResultSetHeader>(
      `UPDATE background_jobs 
       SET status = 'delayed', failed_reason = ?, duration_ms = ?, processed_at = NOW() 
       WHERE id = ?`,
      [reason, durationMs || null, id]
    );

    if (queueName) {
      await pool.execute(
        `UPDATE workers 
         SET delayed_count = delayed_count + 1, last_heartbeat_at = NOW() 
         WHERE queue_name = ?`,
        [queueName]
      );
    }
  } else {
    await pool.execute<ResultSetHeader>(
      `UPDATE background_jobs 
       SET status = 'failed', failed_reason = ?, duration_ms = ?, processed_at = NOW(), finished_at = NOW() 
       WHERE id = ?`,
      [reason, durationMs || null, id]
    );

    if (queueName) {
      await pool.execute(
        `UPDATE workers 
         SET failed_count = failed_count + 1, last_heartbeat_at = NOW() 
         WHERE queue_name = ?`,
        [queueName]
      );
    }
  }
}

/**
 * Processa a sincronização individual ou em lote de grupo do WhatsApp pela Evolution API
 */
export async function processGroupSyncJob(job: JobRecord): Promise<{ success: boolean; error?: string; delayMs?: number; updatedCount?: number }> {
  const start = Date.now();
  const payload = job.payload || {};
  const companyId = Number(payload.companyId || payload.company_id || 1);
  const targetGroupId = payload.group_id ? Number(payload.group_id) : null;
  const targetJid = (payload.whatsapp_group_id || payload.jid) as string | undefined;
  const pool = getDbPool();

  try {
    // 1. Obter grupos cadastrados para a empresa (ou o grupo específico se for job individual)
    let query = `SELECT id, whatsapp_group_id, name, group_type, status, instance_id, participants_count FROM company_whatsapp_groups WHERE company_id = ?`;
    const params: any[] = [companyId];

    if (targetGroupId) {
      query += ` AND id = ?`;
      params.push(targetGroupId);
    } else if (targetJid) {
      query += ` AND whatsapp_group_id = ?`;
      params.push(targetJid);
    }

    const [savedGroups] = await pool.query<RowDataPacket[]>(query, params);

    if (savedGroups.length === 0) {
      const duration = Date.now() - start;
      await completeJob(job.id, duration, job.queue_name);
      return { success: true, updatedCount: 0 };
    }

    // 2. Obter instância ativa
    const instanceId = payload.instance_id || savedGroups[0].instance_id;
    let instance: RowDataPacket | undefined;

    if (instanceId) {
      const [instRows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM instances WHERE id = ? AND company_id = ? LIMIT 1`,
        [instanceId, companyId]
      );
      instance = instRows[0];
    }

    if (!instance) {
      const [instances] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM instances WHERE company_id = ? AND status = 'connected' ORDER BY is_default DESC, id DESC LIMIT 1`,
        [companyId]
      );
      instance = instances[0];
    }

    if (!instance) {
      const [allInstances] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM instances WHERE company_id = ? ORDER BY is_default DESC, id DESC LIMIT 1`,
        [companyId]
      );
      instance = allInstances[0];
    }

    if (!instance || !instance.name) {
      const err = "Nenhuma instância do WhatsApp encontrada para sincronizar grupos";
      await failJob(job.id, err, Date.now() - start, job.queue_name);
      return { success: false, error: err };
    }

    const { getEvolutionConfig } = await import("@/lib/evolution");
    const { url, apiKey } = getEvolutionConfig();

    let evoMap = new Map<string, any>();

    // Aplica a política anti-ban (jitter e delay) configurada no worker para esta fila
    const workerConfig = await getWorkerConfigByQueue(job.queue_name);
    const minDelay = workerConfig?.min_delay_seconds ?? 5;
    const maxDelay = workerConfig?.max_delay_seconds ?? 15;
    const batchSize = workerConfig?.batch_size ?? 10;
    const batchPause = workerConfig?.batch_pause_seconds ?? 30;

    const { waitedMs } = await scheduleInstanceDelay(
      instance.name,
      minDelay,
      maxDelay,
      batchSize,
      batchPause
    );

    // Se for sincronização individual de um único grupo, tenta buscar direto por JID se a Evolution permitir
    const singleJid = savedGroups.length === 1 ? savedGroups[0].whatsapp_group_id : null;
    let foundSingle = false;

    if (singleJid) {
      try {
        const singleEndpoint = `${url}/group/findGroupInfos/${instance.name}?groupJid=${encodeURIComponent(singleJid)}`;
        const singleRes = await fetch(singleEndpoint, {
          headers: { apikey: apiKey },
          signal: AbortSignal.timeout(8000),
        });
        if (singleRes.ok) {
          const singleData = await singleRes.json();
          if (singleData && (singleData.id || singleData.jid || singleData.subject)) {
            evoMap.set(singleJid, singleData);
            foundSingle = true;
          }
        }
      } catch {
        // Fallback para fetchAllGroups
      }
    }

    if (!foundSingle) {
      const endpoint = `${url}/group/fetchAllGroups/${instance.name}?getParticipants=false`;
      const evoRes = await fetch(endpoint, {
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(15000),
      });

      if (!evoRes.ok) {
        const errMsg = `Erro HTTP ${evoRes.status} retornado pela Evolution API ao buscar grupos`;
        await failJob(job.id, errMsg, Date.now() - start, job.queue_name);
        return { success: false, error: errMsg };
      }

      const evoData = await evoRes.json();
      const rawGroups: any[] = Array.isArray(evoData) ? evoData : evoData?.response || [];

      for (const g of rawGroups) {
        const jid = g.id || g.jid;
        if (jid) evoMap.set(jid, g);
      }
    }

    let updatedCount = 0;
    for (const group of savedGroups) {
      if (!group.whatsapp_group_id) continue;

      const liveGroup = evoMap.get(group.whatsapp_group_id);
      if (liveGroup) {
        const liveSubject = liveGroup.subject || liveGroup.name || group.name;
        const liveDesc = liveGroup.desc || liveGroup.description || null;
        const liveParticipants = Array.isArray(liveGroup.participants)
          ? liveGroup.participants.length
          : liveGroup.size || group.participants_count || 0;
        const livePictureUrl = liveGroup.pictureUrl || null;
        const isAnnounceClosed = liveGroup.announce === true || liveGroup.announce === "true" || liveGroup.announce === 1;
        const canSendMessages = isAnnounceClosed ? "admin_only" : "all";
        const newStatus = group.status === "sync_pending" ? "active" : group.status;
        const updatedGroupType = isAnnounceClosed ? "closed" : (group.group_type || "offers");

        await pool.query<ResultSetHeader>(
          `UPDATE company_whatsapp_groups
           SET name = ?,
               description = COALESCE(?, description),
               participants_count = ?,
               avatar_url = COALESCE(?, avatar_url),
               can_send_messages = ?,
               group_type = ?,
               status = ?,
               instance_id = COALESCE(?, instance_id),
               updated_at = NOW()
           WHERE id = ? AND company_id = ?`,
          [
            liveSubject,
            liveDesc,
            liveParticipants,
            livePictureUrl,
            canSendMessages,
            updatedGroupType,
            newStatus,
            instance.id,
            group.id,
            companyId,
          ]
        );
        updatedCount++;
      }
    }

    const duration = Date.now() - start;
    await completeJob(job.id, duration, job.queue_name);
    return { success: true, updatedCount, delayMs: waitedMs };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Erro desconhecido ao sincronizar grupo";
    await failJob(job.id, errMsg, Date.now() - start, job.queue_name);
    return { success: false, error: errMsg };
  }
}

/**
 * Processa um job de envio de WhatsApp respeitando o delay randômico configurado no worker por instância
 */
export async function processWhatsAppJob(job: JobRecord): Promise<{ success: boolean; error?: string; delayMs?: number }> {
  const start = Date.now();
  const payload = job.payload || {};
  
  // Resolve nome da instância (se não especificado ou default, busca a padrão is_default = 1 no banco)
  let instanceName = (payload.instanceName as string) || (payload.instance_name as string);
  if (!instanceName || instanceName === "default") {
    try {
      const pool = getDbPool();
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT name, instance_key FROM instances WHERE is_default = TRUE LIMIT 1"
      );
      if (rows.length > 0) {
        instanceName = rows[0].name || rows[0].instance_key;
      } else {
        instanceName = "matriz-saas";
      }
    } catch {
      instanceName = "matriz-saas";
    }
  }

  const number = (payload.number as string) || (payload.phone as string) || (payload.recipient as string);
  const text = (payload.text as string) || (payload.message as string);

  if (!number || !text) {
    const err = "Payload do job inválido: número ou mensagem ausente";
    await failJob(job.id, err, Date.now() - start, job.queue_name);
    return { success: false, error: err };
  }

  const workerConfig = await getWorkerConfigByQueue(job.queue_name);
  const minDelay = workerConfig?.min_delay_seconds ?? 3;
  const maxDelay = workerConfig?.max_delay_seconds ?? 15;
  const batchSize = workerConfig?.batch_size ?? 10;
  const batchPause = workerConfig?.batch_pause_seconds ?? 30;

  // Aplica a espera randômica programada por instância antes do disparo
  const { waitedMs } = await scheduleInstanceDelay(
    instanceName,
    minDelay,
    maxDelay,
    batchSize,
    batchPause
  );

  try {
    const result = await sendEvolutionText(instanceName, number, text);

    if (result.ok) {
      const duration = Date.now() - start;
      await completeJob(job.id, duration, job.queue_name);
      return { success: true, delayMs: waitedMs };
    } else {
      const errMsg = typeof result.data === "object" && result.data !== null && "error" in result.data
        ? String((result.data as { error: unknown }).error)
        : `Erro HTTP ${result.status} retornado pela Evolution API`;

      await failJob(job.id, errMsg, Date.now() - start, job.queue_name);
      return { success: false, error: errMsg, delayMs: waitedMs };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Erro desconhecido durante o disparo";
    await failJob(job.id, errMsg, Date.now() - start, job.queue_name);
    return { success: false, error: errMsg, delayMs: waitedMs };
  }
}

/**
 * Processa um lote de jobs pendentes de todas as filas ativas (ou de uma fila específica)
 */
export async function processActiveQueues(
  targetQueue?: string,
  limitPerQueue: number = 5
): Promise<{ processedCount: number; results: Array<{ jobId: string; name: string; result: any }> }> {
  const pool = getDbPool();
  
  let queueList: string[] = [];
  if (targetQueue && targetQueue !== "all") {
    queueList = [targetQueue];
  } else {
    // Busca filas ativas que não estejam pausadas
    const [queues] = await pool.query<RowDataPacket[]>(
      "SELECT name FROM queues WHERE is_paused = 0 ORDER BY id ASC"
    );
    queueList = queues.map((q) => q.name);
  }

  const results: Array<{ jobId: string; name: string; result: any }> = [];

  for (const qName of queueList) {
    // Verifica se o worker correspondente está ativo
    const workerConfig = await getWorkerConfigByQueue(qName);
    if (workerConfig && (workerConfig.status === "paused" || workerConfig.status === "stopped")) {
      continue;
    }

    const concurrency = Math.min(10, Math.max(1, workerConfig?.concurrency || 1));
    const batchLimit = Math.min(limitPerQueue, concurrency);

    for (let i = 0; i < batchLimit; i++) {
      const job = await dequeueJob(qName);
      if (!job) break;

      let res: any;
      if (job.name === "sync_groups" || job.queue_name === "evolution-webhook-sync") {
        res = await processGroupSyncJob(job);
      } else {
        res = await processWhatsAppJob(job);
      }

      results.push({
        jobId: job.id,
        name: job.name,
        result: res,
      });
    }
  }

  return {
    processedCount: results.length,
    results,
  };
}
