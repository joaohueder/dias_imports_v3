import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  
  // DB Health
  let dbStatus = "healthy";
  let dbLatencyMs = 0;
  let dbError = null;

  try {
    const t0 = Date.now();
    const pool = getDbPool();
    await pool.query("SELECT 1");
    dbLatencyMs = Date.now() - t0;
  } catch (err: unknown) {
    dbStatus = "unhealthy";
    dbError = err instanceof Error ? err.message : "Erro desconhecido";
  }

  // System Resources
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round((usedMem / totalMem) * 100);
  const uptimeSeconds = Math.round(process.uptime());

  // Load Average (on Windows this might return [0,0,0], fallback gracefully)
  const loadAvg = os.loadavg();

  return NextResponse.json({
    status: dbStatus === "healthy" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    latency: Date.now() - startTime,
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      type: "MySQL 8.x",
      error: dbError,
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      uptimeSeconds,
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || "Generic CPU",
      memory: {
        totalBytes: totalMem,
        usedBytes: usedMem,
        freeBytes: freeMem,
        usagePercent: memUsagePercent,
      },
      loadAverage: loadAvg,
      nodeVersion: process.version,
    },
    services: {
      api: { status: "online", latencyMs: 2 },
      whatsappWorkers: { status: "idle", count: 0 },
      redis: { status: "standby", queueJobs: 0 },
    },
  });
}
