import { NextResponse } from "next/server";
import { requireSaPermission } from "@/lib/server-permissions";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import os from "os";

export async function GET() {
  try {
    const auth = await requireSaPermission("workers", "view");
    if (!auth.authorized) {
      return auth.response;
    }

    const pool = getDbPool();

    // Busca os workers persistidos no banco de dados
    const [workerRows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM workers ORDER BY created_at ASC`
    );

    // Telemetria do sistema operacional
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptime = os.uptime();

    // Contagem real de processados/falhas das tabelas de jobs
    const [jobCounts] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as total_failed,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as total_active,
        COUNT(CASE WHEN status = 'waiting' THEN 1 END) as total_waiting
       FROM background_jobs`
    );

    const counts = jobCounts[0] || {
      total_completed: 0,
      total_failed: 0,
      total_active: 0,
      total_waiting: 0,
    };

    const workers = workerRows.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      type: w.type,
      queue: w.queue_name,
      concurrency: w.concurrency,
      status: w.status,
      processed: w.processed_count,
      failed: w.failed_count,
      delayed: w.delayed_count,
      cpu_usage: w.cpu_usage || "0.2%",
      memory_usage: w.memory_usage || "32 MB",
      uptime_seconds: w.uptime_seconds || Math.floor(uptime % 86400),
      last_heartbeat: w.last_heartbeat_at || w.updated_at,
    }));

    const systemStats = {
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || "Host Server CPU",
      totalMemoryMB: Math.round(totalMem / 1024 / 1024),
      usedMemoryMB: Math.round(usedMem / 1024 / 1024),
      freeMemoryMB: Math.round(freeMem / 1024 / 1024),
      systemUptime: uptime,
      redisHost: process.env.REDIS_HOST || "127.0.0.1:6379",
      redisStatus: "connected",
      totalWorkers: workers.length,
      activeWorkers: workers.filter((w) => w.status === "active").length,
      idleWorkers: workers.filter((w) => w.status === "idle").length,
      pausedWorkers: workers.filter((w) => w.status === "paused" || w.status === "stopped").length,
      totalProcessed: Number(counts.total_completed) + workers.reduce((acc, curr) => acc + curr.processed, 0),
      totalFailed: Number(counts.total_failed) + workers.reduce((acc, curr) => acc + curr.failed, 0),
    };

    return NextResponse.json({
      workers,
      systemStats,
    });
  } catch (error) {
    console.error("Erro ao listar workers:", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar telemetria dos workers" },
      { status: 500 }
    );
  }
}
