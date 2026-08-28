import { getDbPool } from "@/lib/db";
import { sendEvolutionText } from "@/lib/evolution";
import { isPm2DaemonRunning } from "@/lib/pm2";
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
 * Garante e sincroniza a espera por instância ou empresa antes de executar a ação na Evolution API
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

    // 2. Obter instância da empresa
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
        `SELECT * FROM instances WHERE company_id = ? ORDER BY is_default DESC, id DESC LIMIT 1`,
        [companyId]
      );
      instance = instances[0];
    }

    if (!instance || !instance.name) {
      const err = "Nenhuma instância do WhatsApp vinculada a esta empresa foi encontrada";
      await failJob(job.id, err, Date.now() - start, job.queue_name);
      return { success: false, error: err };
    }

    if (instance.status !== "connected" && instance.status !== "open") {
      const err = `A instância [${instance.name}] da empresa está desconectada (status: ${instance.status}). Operação cancelada.`;
      await failJob(job.id, err, Date.now() - start, job.queue_name);
      return { success: false, error: err };
    }

    const { getEvolutionConfig } = await import("@/lib/evolution");
    const { url, apiKey } = getEvolutionConfig();

    let evoMap = new Map<string, any>();

    // Aplica política anti-ban com delay randômico isolado por empresa/instância (sem bloquear outras empresas)
    const workerConfig = await getWorkerConfigByQueue(job.queue_name);
    const minDelay = workerConfig?.min_delay_seconds ?? 5;
    const maxDelay = workerConfig?.max_delay_seconds ?? 15;
    const batchSize = workerConfig?.batch_size ?? 10;
    const batchPause = workerConfig?.batch_pause_seconds ?? 30;

    // Chave isolada por empresa e instância: cada empresa tem seu próprio pipeline temporal de delay
    const companyInstanceKey = `company_${companyId}_instance_${instance.name}`;

    const { waitedMs } = await scheduleInstanceDelay(
      companyInstanceKey,
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
          // A Evolution API v2.3.7 pode retornar o objeto de grupo diretamente ou envelopado em "response"
          const groupData = singleData?.response || singleData;
          if (groupData && (groupData.id || groupData.jid || groupData.subject)) {
            evoMap.set(singleJid, groupData);
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
        // Se a Evolution falhar mas o grupo existir localmente, evita quebrar a fila inteira
        const group = savedGroups[0];
        if (group && group.name) {
          console.warn(`[Jobs Engine] Evolution retornou HTTP ${evoRes.status}. Usando dados locais para evitar quebra.`);
          await pool.query<ResultSetHeader>(
            `UPDATE company_whatsapp_groups
             SET status = 'active', updated_at = NOW()
             WHERE id = ?`,
            [group.id]
          );
          const duration = Date.now() - start;
          await completeJob(job.id, duration, job.queue_name);
          return { success: true, updatedCount: 1 };
        }

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
  const pool = getDbPool();
  const companyId = payload.company_id || payload.companyId;
  
  // Resolve instância vinculada à empresa ou especificada no payload
  let instance: RowDataPacket | undefined;
  const instanceId = payload.instance_id || payload.instanceId;
  let instanceName = (payload.instanceName as string) || (payload.instance_name as string);

  if (instanceId && companyId) {
    const [instRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM instances WHERE id = ? AND company_id = ? LIMIT 1`,
      [instanceId, companyId]
    );
    instance = instRows[0];
  } else if (instanceId) {
    const [instRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM instances WHERE id = ? LIMIT 1`,
      [instanceId]
    );
    instance = instRows[0];
  } else if (instanceName && instanceName !== "default" && companyId) {
    const [instRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM instances WHERE name = ? AND company_id = ? LIMIT 1`,
      [instanceName, companyId]
    );
    instance = instRows[0];
  } else if (instanceName && instanceName !== "default") {
    const [instRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM instances WHERE name = ? LIMIT 1`,
      [instanceName]
    );
    instance = instRows[0];
  } else if (companyId) {
    const [instRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM instances WHERE company_id = ? ORDER BY is_default DESC, id DESC LIMIT 1`,
      [companyId]
    );
    instance = instRows[0];
  } else {
    const [instRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM instances WHERE is_default = TRUE LIMIT 1`
    );
    instance = instRows[0];
  }

  if (!instance || !instance.name) {
    const err = "Nenhuma instância do WhatsApp vinculada para esta operação foi encontrada.";
    await failJob(job.id, err, Date.now() - start, job.queue_name);
    return { success: false, error: err };
  }

  // Se a instância da empresa estiver desconectada, falha o job imediatamente sem utilizar outra instância
  if (instance.status !== "connected" && instance.status !== "open") {
    const err = `A instância [${instance.name}] da empresa está desconectada (status: ${instance.status}). Disparo cancelado.`;
    await failJob(job.id, err, Date.now() - start, job.queue_name);
    return { success: false, error: err };
  }

  instanceName = instance.name;

  const number = (payload.number as string) || (payload.phone as string) || (payload.recipient as string);
  const text = (payload.text as string) || (payload.message as string);
  const mediaUrl = (payload.mediaUrl as string) || (payload.media_url as string) || (payload.image_url as string);
  const fileName = (payload.fileName as string) || (payload.file_name as string);

  if (!number || (!text && !mediaUrl)) {
    const err = "Payload do job inválido: número ou mensagem/mídia ausente";
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
    let result: { ok: boolean; status: number; data: unknown };
    
    if (mediaUrl) {
      let resolvedMedia = mediaUrl;
      // Se a mediaUrl for localhost e estivermos no worker, converte para Base64 lendo do disco public
      if ((resolvedMedia.startsWith("http://localhost") || resolvedMedia.startsWith("http://127.0.0.1") || resolvedMedia.startsWith("/uploads/")) && !resolvedMedia.startsWith("data:")) {
        try {
          const { readFile } = await import("fs/promises");
          const path = await import("path");
          let subPath = resolvedMedia;
          if (subPath.startsWith("http")) {
            subPath = new URL(subPath).pathname;
          }
          const diskPath = path.join(process.cwd(), "public", subPath);
          const fileBuf = await readFile(diskPath);
          const ext = path.extname(diskPath).toLowerCase().replace(".", "") || "jpeg";
          const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
          resolvedMedia = `data:${mime};base64,${fileBuf.toString("base64")}`;
        } catch (e) {
          console.warn("[Jobs-Engine] Não foi possível converter mídia local para Base64:", e);
        }
      }

      const { sendEvolutionMedia } = await import("@/lib/evolution");
      result = await sendEvolutionMedia(instanceName, number, resolvedMedia, text || "", fileName);
    } else {
      result = await sendEvolutionText(instanceName, number, text || "");
    }

    if (result.ok) {
      const duration = Date.now() - start;
      await completeJob(job.id, duration, job.queue_name);
      return { success: true, delayMs: waitedMs };
    } else {
      let errMsg = `Erro HTTP ${result.status} retornado pela Evolution API`;
      if (typeof result.data === "object" && result.data !== null) {
        const obj = result.data as any;
        if (obj.response?.message) {
          errMsg = Array.isArray(obj.response.message) ? obj.response.message.join(", ") : String(obj.response.message);
        } else if (obj.message) {
          errMsg = Array.isArray(obj.message) ? obj.message.join(", ") : String(obj.message);
        } else if (obj.error) {
          errMsg = String(obj.error);
        }
      }

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
 * Processa a rotina de verificação de integridade e telemetria do sistema (health-check)
 */
export async function processHealthMonitorJob(job: JobRecord): Promise<{ success: boolean; error?: string; health?: Record<string, unknown> }> {
  const start = Date.now();
  const pool = getDbPool();

  try {
    let dbStatus = "online";
    let dbLatencyMs = 0;
    try {
      const t0 = Date.now();
      await pool.query("SELECT 1");
      dbLatencyMs = Date.now() - t0;
    } catch {
      dbStatus = "offline";
    }

    let redisStatus = "online";
    let redisLatencyMs = 0;
    try {
      const host = process.env.REDIS_HOST || "127.0.0.1";
      const port = Number(process.env.REDIS_PORT) || 6379;
      const password = process.env.REDIS_PASSWORD || "";
      const net = await import("net");

      const probeRedis = () => {
        const t0 = Date.now();
        return new Promise<number>((resolve, reject) => {
          const s = net.createConnection(port, host);
          s.setTimeout(2500);
          s.setNoDelay(true);
          s.on("connect", () => {
            if (password) {
              s.write(`AUTH ${password}\r\n`);
            } else {
              s.write("PING\r\n");
            }
          });
          s.on("data", (data) => {
            const resStr = data.toString();
            if (resStr.includes("+OK")) {
              s.write("PING\r\n");
            } else if (resStr.includes("+PONG")) {
              const latency = Date.now() - t0;
              s.end();
              resolve(latency);
            } else if (resStr.includes("-ERR") || resStr.includes("-NOAUTH")) {
              s.end();
              reject(new Error(resStr.trim()));
            }
          });
          s.on("error", (e) => {
            s.destroy();
            reject(e);
          });
          s.on("timeout", () => {
            s.destroy();
            reject(new Error("Timeout"));
          });
        });
      };

      try {
        redisLatencyMs = await probeRedis();
      } catch {
        await new Promise((r) => setTimeout(r, 100));
        redisLatencyMs = await probeRedis();
      }
    } catch {
      redisStatus = "offline";
    }

    let pm2Status = "online";
    try {
      const isPm2Active = await isPm2DaemonRunning();
      pm2Status = isPm2Active ? "online" : "offline";
    } catch {
      pm2Status = "offline";
    }

    let evolutionStatus = "online";
    let whatsappStatus = "disconnected";
    let whatsappPhone: string | null = null;
    let whatsappProfile: string | null = null;

    try {
      const { getEvolutionConfig } = await import("@/lib/evolution");
      const { url, apiKey } = getEvolutionConfig();
      const evoRes = await fetch(`${url}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(4000),
      });

      let evoInstances: any[] = [];
      if (evoRes.ok) {
        evolutionStatus = "online";
        evoInstances = await evoRes.json().catch(() => []);
      } else {
        evolutionStatus = "degraded";
      }

      // Busca qual instância é a padrão no banco de dados
      const [instRows] = await pool.query<RowDataPacket[]>(
        "SELECT id, name, status, phone_connected, profile_name FROM instances WHERE is_default = TRUE LIMIT 1"
      );

      if (instRows.length > 0) {
        const defaultInst = instRows[0];
        const evoMatch = Array.isArray(evoInstances)
          ? evoInstances.find((ei) => (ei.name || "").toLowerCase() === (defaultInst.name || "").toLowerCase())
          : null;

        if (evoMatch) {
          const isOpen = evoMatch.connectionStatus === "open";
          whatsappStatus = isOpen ? "connected" : (evoMatch.connectionStatus === "connecting" ? "connecting" : "disconnected");
          const jidPhone = (evoMatch.ownerJid || "").split("@")[0] || null;
          whatsappPhone = isOpen ? (jidPhone || defaultInst.phone_connected || null) : null;
          whatsappProfile = isOpen ? (evoMatch.profileName || defaultInst.profile_name || null) : null;

          // Sincroniza o status real de volta na tabela instances
          try {
            await pool.query(
              `UPDATE instances 
               SET status = ?, 
                   phone_connected = ?, 
                   profile_name = ?, 
                   updated_at = NOW() 
               WHERE id = ?`,
              [whatsappStatus, whatsappPhone, whatsappProfile, defaultInst.id]
            );
          } catch {
            // Ignora erro se DB estiver em falha transitória
          }
        } else {
          whatsappStatus = defaultInst.status === "connected" ? "connected" : "disconnected";
          whatsappPhone = defaultInst.phone_connected || null;
          whatsappProfile = defaultInst.profile_name || null;
        }
      }
    } catch {
      evolutionStatus = "offline";
    }

    const os = await import("os");
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptime = os.uptime();

    // Se o banco estiver offline, todos os serviços dependentes ficam comprometidos
    if (dbStatus === "offline") {
      redisStatus = "offline";
      pm2Status = "offline";
      evolutionStatus = "offline";
      whatsappStatus = "disconnected";
    }

    // O status da infraestrutura é saudável se DB, Redis e Evolution API estão online (WhatsApp desconectado não invalida a saúde da infra)
    const overallStatus = dbStatus === "online" && redisStatus === "online" && evolutionStatus === "online" 
      ? (pm2Status === "online" ? "healthy" : "degraded") 
      : (dbStatus === "offline" ? "offline" : "degraded");

    // 1. Salva em arquivo local (resiliente mesmo se o MySQL cair)
    try {
      const { writeHealthSnapshotToFile } = await import("@/lib/health-snapshot");
      writeHealthSnapshotToFile({
        id: 1,
        status: overallStatus,
        db_status: dbStatus,
        db_latency_ms: dbLatencyMs,
        redis_status: redisStatus,
        redis_latency_ms: redisLatencyMs,
        pm2_status: pm2Status,
        evolution_status: evolutionStatus,
        whatsapp_status: whatsappStatus as "connected" | "disconnected" | "connecting",
        whatsapp_phone: whatsappPhone,
        whatsapp_profile: whatsappProfile,
        system_cpu_usage: "0.1%",
        system_total_mem_mb: Math.round(totalMem / 1024 / 1024),
        system_used_mem_mb: Math.round(usedMem / 1024 / 1024),
        system_uptime_seconds: uptime,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Ignora falha de gravação no arquivo
    }

    // 2. Salva ou atualiza o snapshot consolidado no banco de dados se disponível
    try {
      await pool.query(
        `INSERT INTO system_health_snapshots (
          id, status, db_status, db_latency_ms, redis_status, redis_latency_ms,
          pm2_status, evolution_status, whatsapp_status, whatsapp_phone,
          whatsapp_profile, system_cpu_usage, system_total_mem_mb,
          system_used_mem_mb, system_uptime_seconds, raw_payload, updated_at
        ) VALUES (
          1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
        ) ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          db_status = VALUES(db_status),
          db_latency_ms = VALUES(db_latency_ms),
          redis_status = VALUES(redis_status),
          redis_latency_ms = VALUES(redis_latency_ms),
          pm2_status = VALUES(pm2_status),
          evolution_status = VALUES(evolution_status),
          whatsapp_status = VALUES(whatsapp_status),
          whatsapp_phone = VALUES(whatsapp_phone),
          whatsapp_profile = VALUES(whatsapp_profile),
          system_cpu_usage = VALUES(system_cpu_usage),
          system_total_mem_mb = VALUES(system_total_mem_mb),
          system_used_mem_mb = VALUES(system_used_mem_mb),
          system_uptime_seconds = VALUES(system_uptime_seconds),
          raw_payload = VALUES(raw_payload),
          updated_at = NOW()`,
        [
          overallStatus,
          dbStatus,
          dbLatencyMs,
          redisStatus,
          redisLatencyMs,
          pm2Status,
          evolutionStatus,
          whatsappStatus,
          whatsappPhone,
          whatsappProfile,
          "0.1%",
          Math.round(totalMem / 1024 / 1024),
          Math.round(usedMem / 1024 / 1024),
          uptime,
          JSON.stringify({ checkedAt: new Date().toISOString() }),
        ]
      );
    } catch {
      // Falha ao gravar no banco se o banco estiver offline
    }

    const duration = Date.now() - start;
    try {
      await completeJob(job.id, duration, job.queue_name);
    } catch {
      // Ignora erro de finalização de job se o banco estiver offline
    }
    return { success: true, health: { status: overallStatus, dbStatus, redisStatus, evolutionStatus, whatsappStatus } };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Erro ao executar health monitor";
    try {
      await failJob(job.id, errMsg, Date.now() - start, job.queue_name);
    } catch {
      // Ignora erro de marcação de falha se o banco estiver offline
    }
    return { success: false, error: errMsg };
  }
}

/**
 * Processa a consolidação analítica e agregação de métricas do sistema
 */
export async function processAnalyticsAggregationJob(job: JobRecord): Promise<{ success: boolean; error?: string; metrics?: Record<string, unknown> }> {
  const start = Date.now();
  const pool = getDbPool();

  try {
    // 1. Consolida estatísticas globais e por tenant
    const [productMetrics] = await pool.query<RowDataPacket[]>(
      `SELECT 
         COUNT(*) as total_products,
         COALESCE(SUM(views_count), 0) as total_views,
         COALESCE(SUM(clicks_count), 0) as total_clicks,
         COALESCE(SUM(sends_count), 0) as total_sends
       FROM company_products`
    );

    const [leadMetrics] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total_leads FROM company_leads`
    );

    const [groupMetrics] = await pool.query<RowDataPacket[]>(
      `SELECT 
         COUNT(*) as total_groups,
         COALESCE(SUM(participants_count), 0) as total_participants
       FROM company_whatsapp_groups`
    );

    const metrics = {
      products: productMetrics[0] || {},
      leads: leadMetrics[0] || {},
      groups: groupMetrics[0] || {},
      aggregated_at: new Date().toISOString(),
    };

    const duration = Date.now() - start;
    await completeJob(job.id, duration, job.queue_name);
    return { success: true, metrics };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Erro desconhecido ao agregar analíticos";
    await failJob(job.id, errMsg, Date.now() - start, job.queue_name);
    return { success: false, error: errMsg };
  }
}

/**
 * Processa a rotina diária de verificação de assinaturas e expirações (cron-subscriptions)
 */
export async function processCronSubscriptionsJob(job: JobRecord): Promise<{ success: boolean; error?: string; updatedCount?: number }> {
  const start = Date.now();
  const pool = getDbPool();

  try {
    // 1. Marca como past_due ou expired assinaturas ativas com vencimento anterior a hoje
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE subscriptions
       SET status = 'past_due', updated_at = NOW()
       WHERE status = 'active'
         AND current_period_end IS NOT NULL
         AND current_period_end < CURDATE()`
    );

    const duration = Date.now() - start;
    await completeJob(job.id, duration, job.queue_name);
    return { success: true, updatedCount: result.affectedRows };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Erro desconhecido na rotina de assinaturas";
    await failJob(job.id, errMsg, Date.now() - start, job.queue_name);
    return { success: false, error: errMsg };
  }
}

/**
 * Processa a limpeza e retenção de jobs concluídos mais antigos que 7 dias
 */
export async function processHousekeepingJob(job: JobRecord): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  const start = Date.now();
  const pool = getDbPool();

  try {
    // Remove jobs concluídos criados há mais de 7 dias
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM background_jobs
       WHERE status = 'completed'
         AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    const duration = Date.now() - start;
    await completeJob(job.id, duration, job.queue_name);
    return { success: true, deletedCount: result.affectedRows };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Erro desconhecido na limpeza de jobs";
    await failJob(job.id, errMsg, Date.now() - start, job.queue_name);
    return { success: false, error: errMsg };
  }
}

/**
 * Processa um lote de jobs pendentes de todas as filas ativas (ou de uma fila específica)
 */
export async function processActiveQueues(
  targetQueue?: string,
  limitPerQueue: number = 5,
  skipPm2Check: boolean = true
): Promise<{ processedCount: number; results: Array<{ jobId: string; name: string; result: any }> }> {
  // Apenas executa se o PM2 estiver ativo e rodando (exceto se explicitamente ignorado)
  if (!skipPm2Check) {
    const isPm2Active = await isPm2DaemonRunning();
    if (!isPm2Active) {
      return { processedCount: 0, results: [] };
    }
  }

  const pool = getDbPool();
  
  let queueList: string[] = [];
  if (targetQueue && targetQueue !== "all") {
    queueList = [targetQueue];
  } else {
    // Busca filas ativas dos workers cadastrados ou da tabela queues
    try {
      const [workers] = await pool.query<RowDataPacket[]>(
        "SELECT DISTINCT queue_name FROM workers WHERE status IN ('active', 'idle')"
      );
      queueList = workers.map((w) => w.queue_name);
    } catch {
      // Fallback para queues
    }

    if (queueList.length === 0) {
      try {
        const [queues] = await pool.query<RowDataPacket[]>(
          "SELECT name FROM queues WHERE is_paused = 0 ORDER BY id ASC"
        );
        queueList = queues.map((q) => q.name);
      } catch {
        queueList = ["system-health-monitor", "whatsapp-groups-sync", "whatsapp-messages-default", "cron-subscriptions"];
      }
    }
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
      let job = await dequeueJob(qName);
      
      // Se for a fila de saúde e não houver job em espera, cria um job sob demanda imediatamente
      if (!job && qName === "system-health-monitor") {
        job = await enqueueJob("system-health-monitor", "health_check", { trigger: "scheduled_or_daemon" });
        job = await dequeueJob(qName);
      } else if (!job && qName === "cron-subscriptions") {
        // Se for a fila de verificação de assinaturas e não houver job em espera, enfileira a tarefa
        job = await enqueueJob("cron-subscriptions", "verify_subscriptions", { trigger: "scheduled_or_daemon" });
        job = await dequeueJob(qName);
      }

      if (!job) break;

      let res: any;
      if (job.queue_name === "system-health-monitor" || job.name === "health_check" || job.name === "monitor_health") {
        res = await processHealthMonitorJob(job);
      } else if (
        job.name === "sync_groups" || 
        job.name.startsWith("sync_group_") || 
        job.queue_name === "evolution-webhook-sync" || 
        job.queue_name === "whatsapp-groups-sync"
      ) {
        res = await processGroupSyncJob(job);
      } else if (job.queue_name === "analytics-aggregation" || job.name === "aggregate_metrics") {
        res = await processAnalyticsAggregationJob(job);
      } else if (job.queue_name === "cron-subscriptions" || job.name === "verify_subscriptions") {
        res = await processCronSubscriptionsJob(job);
      } else if (job.name === "cleanup_old_jobs") {
        res = await processHousekeepingJob(job);
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
