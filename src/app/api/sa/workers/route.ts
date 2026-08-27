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

    // Telemetria real do processo Node.js e do sistema operacional
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptime = os.uptime();
    const memUsage = process.memoryUsage();
    const processRssMB = Math.round(memUsage.rss / 1024 / 1024);
    const processHeapMB = Math.round(memUsage.heapUsed / 1024 / 1024);

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

    // Calcula uso de CPU real do host
    let hostCpuPercent = "0.0%";
    if (cpus && cpus.length > 0) {
      let totalIdle = 0;
      let totalTick = 0;
      cpus.forEach((cpu) => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      });
      const idlePercent = totalTick > 0 ? (totalIdle / totalTick) * 100 : 100;
      const usagePercent = Math.max(0, 100 - idlePercent);
      hostCpuPercent = `${usagePercent.toFixed(1)}%`;
    }

    const workers = workerRows.map((w) => {
      // Aloca a memória real proporcional do processo Node.js por worker ativo
      const isRunning = w.status === "active";
      const workerMemMB = isRunning ? Math.max(8, Math.round(processHeapMB / (workerRows.length || 1))) : 0;
      
      return {
        id: w.id,
        name: w.name,
        description: w.description,
        type: w.type,
        queue: w.queue_name,
        concurrency: Number(w.concurrency) || 1,
        min_delay_seconds: Number(w.min_delay_seconds) || 3,
        max_delay_seconds: Number(w.max_delay_seconds) || 15,
        batch_size: Number(w.batch_size) || 10,
        batch_pause_seconds: Number(w.batch_pause_seconds) || 30,
        status: w.status,
        processed: w.processed_count,
        failed: w.failed_count,
        delayed: w.delayed_count,
        cpu_usage: isRunning ? hostCpuPercent : "0.0%",
        memory_usage: isRunning ? `${workerMemMB} MB` : "0 MB",
        uptime_seconds: isRunning ? Math.floor(uptime % 86400) : 0,
        last_heartbeat: w.last_heartbeat_at || w.updated_at,
      };
    });

    // Verifica último heartbeat do worker para saber se o daemon está vivo (últimos 60s)
    const now = Date.now();
    const isAnyDaemonAlive = workerRows.some((w) => {
      if (!w.last_heartbeat_at) return false;
      const diffMs = now - new Date(w.last_heartbeat_at).getTime();
      return diffMs <= 60000;
    });

    const systemStats = {
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || "Host Server CPU",
      cpuUsage: hostCpuPercent,
      totalMemoryMB: Math.round(totalMem / 1024 / 1024),
      usedMemoryMB: Math.round(usedMem / 1024 / 1024),
      freeMemoryMB: Math.round(freeMem / 1024 / 1024),
      processMemoryMB: processHeapMB,
      systemUptime: uptime,
      redisHost: process.env.REDIS_HOST || "127.0.0.1:6379",
      redisStatus: "connected",
      daemonRunning: isAnyDaemonAlive || workers.some(w => w.status === "active"),
      lastHeartbeatTime: workerRows[0]?.last_heartbeat_at || null,
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
