import { NextRequest, NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser, getEffectiveCompanyId } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const companyId = await getEffectiveCompanyId(user, request.cookies);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não associada" }, { status: 403 });
    }

    const pool = getDbPool();

    // 1. Estatísticas consolidadas dos jobs desta empresa específica
    const [statsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(CASE WHEN status = 'waiting' THEN 1 END) as totalWaiting,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as totalActive,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as totalCompleted,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as totalFailed,
        COUNT(CASE WHEN status = 'delayed' THEN 1 END) as totalDelayed,
        COUNT(DISTINCT queue_name) as totalQueues
       FROM background_jobs
       WHERE queue_name != 'system-health-monitor'
         AND name NOT IN ('health_check', 'monitor_health')
         AND (
           JSON_UNQUOTE(JSON_EXTRACT(payload, '$.company_id')) = ?
           OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.companyId')) = ?
         )`,
      [String(companyId), String(companyId)]
    );

    // 2. Busca histórico das tarefas recentes da empresa
    const [jobRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM background_jobs
       WHERE queue_name != 'system-health-monitor'
         AND name NOT IN ('health_check', 'monitor_health')
         AND (
           JSON_UNQUOTE(JSON_EXTRACT(payload, '$.company_id')) = ?
           OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.companyId')) = ?
         )
       ORDER BY created_at DESC
       LIMIT 100`,
      [String(companyId), String(companyId)]
    );

    const stats = {
      totalQueues: Number(statsRows[0]?.totalQueues || 0),
      totalWaiting: Number(statsRows[0]?.totalWaiting || 0),
      totalActive: Number(statsRows[0]?.totalActive || 0),
      totalCompleted: Number(statsRows[0]?.totalCompleted || 0),
      totalFailed: Number(statsRows[0]?.totalFailed || 0),
      totalDelayed: Number(statsRows[0]?.totalDelayed || 0),
    };

    const recentJobs = jobRows.map((j) => ({
      id: j.id,
      queue: j.queue_name,
      name: j.name,
      data: typeof j.payload === "string" ? JSON.parse(j.payload || "{}") : (j.payload || {}),
      status: j.status,
      attempts: j.attempts,
      max_attempts: j.max_attempts,
      failedReason: j.failed_reason,
      duration_ms: j.duration_ms,
      processedOn: j.processed_at,
      finishedOn: j.finished_at,
      createdAt: j.created_at,
    }));

    return NextResponse.json({
      success: true,
      stats,
      recentJobs,
    });
  } catch (error: any) {
    console.error("Erro ao listar tarefas da empresa:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao listar tarefas" },
      { status: 500 }
    );
  }
}
