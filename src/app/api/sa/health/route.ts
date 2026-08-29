import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import os from "os";
import { requireSaPermission } from "@/lib/server-permissions";
import { RowDataPacket } from "mysql2";
import { readHealthSnapshotFromFile } from "@/lib/health-snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSaPermission("health", "view");
  if (!auth.authorized) return auth.response;

  const startTime = Date.now();
  const pool = getDbPool();

  // 1. Snapshot salvo em arquivo/tabela
  const fileSnap = readHealthSnapshotFromFile();

  // 2. DB Health & Latência em tempo real
  let dbStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const t0 = Date.now();
    await pool.query("SELECT 1");
    dbLatencyMs = Date.now() - t0;
  } catch (err: unknown) {
    dbStatus = "unhealthy";
    dbError = err instanceof Error ? err.message : "Erro na conexão com banco de dados";
  }

  // 3. Consultas adicionais de telemetria dos serviços internos (Workers, Queues, Jobs, Instâncias)
  let workersTotal = 0;
  let workersActive = 0;
  let queuesTotal = 0;
  let queuesActive = 0;
  let jobsPending = 0;
  let jobsFailed = 0;
  let jobsCompleted = 0;
  let instancesTotal = 0;
  let instancesConnected = 0;

  if (dbStatus === "healthy") {
    try {
      const [workersRows] = await pool.query<RowDataPacket[]>(
        "SELECT status, COUNT(*) as count FROM workers GROUP BY status"
      );
      for (const row of workersRows) {
        const count = Number(row.count) || 0;
        workersTotal += count;
        if (row.status === "active" || row.status === "running") {
          workersActive += count;
        }
      }

      const [queuesRows] = await pool.query<RowDataPacket[]>(
        "SELECT is_paused, COUNT(*) as count FROM queues GROUP BY is_paused"
      );
      for (const row of queuesRows) {
        const count = Number(row.count) || 0;
        queuesTotal += count;
        if (row.is_paused === 0 || row.is_paused === false) {
          queuesActive += count;
        }
      }

      const [jobsRows] = await pool.query<RowDataPacket[]>(
        "SELECT status, COUNT(*) as count FROM background_jobs GROUP BY status"
      );
      for (const row of jobsRows) {
        const count = Number(row.count) || 0;
        if (row.status === "waiting" || row.status === "active" || row.status === "delayed") {
          jobsPending += count;
        } else if (row.status === "failed") {
          jobsFailed += count;
        } else if (row.status === "completed") {
          jobsCompleted += count;
        }
      }

      const [instancesRows] = await pool.query<RowDataPacket[]>(
        "SELECT status, COUNT(*) as count FROM instances GROUP BY status"
      );
      for (const row of instancesRows) {
        const count = Number(row.count) || 0;
        instancesTotal += count;
        if (row.status === "connected") {
          instancesConnected += count;
        }
      }
    } catch {
      // Degradação leve nos contadores auxiliares
    }
  }

  // 4. Recursos do Host (CPU, Memória, Disco/Sistema, Processo)
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round((usedMem / totalMem) * 100);
  const uptimeSeconds = Math.round(process.uptime());
  const hostUptimeSeconds = Math.round(os.uptime());
  const processMem = process.memoryUsage();

  // Status de Serviços Consolidados
  const redisStatus = fileSnap?.redis_status || (dbStatus === "healthy" ? "online" : "offline");
  const redisLatencyMs = fileSnap?.redis_latency_ms ?? 0;
  const pm2Status = fileSnap?.pm2_status || "online";
  const evolutionStatus = fileSnap?.evolution_status || (instancesConnected > 0 ? "online" : "offline");

  const isGlobalHealthy = dbStatus === "healthy" && redisStatus === "online" && pm2Status === "online";
  const isGlobalDegraded = dbStatus === "healthy" && (redisStatus !== "online" || pm2Status !== "online" || evolutionStatus !== "online");

  return NextResponse.json({
    status: isGlobalHealthy ? "healthy" : isGlobalDegraded ? "degraded" : "critical",
    timestamp: new Date().toISOString(),
    latency: Date.now() - startTime,
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      type: "MySQL 8.x (Pool Conectado)",
      error: dbError,
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptimeSeconds,
      hostUptimeSeconds,
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || "Multi-core CPU",
      cpuUsage: fileSnap?.system_cpu_usage || "0%",
      memory: {
        totalBytes: totalMem,
        usedBytes: usedMem,
        freeBytes: freeMem,
        usagePercent: memUsagePercent,
      },
      processMemory: {
        rssBytes: processMem.rss,
        heapUsedBytes: processMem.heapUsed,
        heapTotalBytes: processMem.heapTotal,
      },
      nodeVersion: process.version,
    },
    telemetry: {
      workers: {
        total: workersTotal,
        active: workersActive,
        status: workersActive > 0 ? "active" : "idle",
      },
      queues: {
        total: queuesTotal,
        active: queuesActive,
      },
      jobs: {
        pending: jobsPending,
        failed: jobsFailed,
        completed: jobsCompleted,
      },
      instances: {
        total: instancesTotal,
        connected: instancesConnected,
      },
    },
    services: {
      api: {
        name: "Core Next.js API & App Router",
        status: "online",
        latencyMs: Math.max(1, Date.now() - startTime),
      },
      database: {
        name: "MySQL Cluster & Schema",
        status: dbStatus === "healthy" ? "online" : "offline",
        latencyMs: dbLatencyMs,
      },
      redis: {
        name: "Redis Server / In-Memory Cache",
        status: redisStatus,
        latencyMs: redisLatencyMs,
      },
      pm2: {
        name: "PM2 Process Manager / Daemon",
        status: pm2Status,
        uptimeSeconds: fileSnap?.system_uptime_seconds || uptimeSeconds,
      },
      evolution: {
        name: "Evolution API v2.3.7 Gateway",
        status: evolutionStatus,
        activeInstances: `${instancesConnected}/${instancesTotal}`,
      },
    },
  });
}
