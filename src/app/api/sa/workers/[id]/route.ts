import { NextRequest, NextResponse } from "next/server";
import { requireSaPermission } from "@/lib/server-permissions";
import { getDbPool } from "@/lib/db";
import { ResultSetHeader } from "mysql2";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireSaPermission("workers", "edit");
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const {
      concurrency,
      min_delay_seconds,
      max_delay_seconds,
      batch_size,
      batch_pause_seconds,
      schedule_enabled,
      schedule_interval_seconds,
      schedule_interval_minutes,
    } = body;

    const parsedConcurrency = Math.max(1, Math.min(50, Number(concurrency) || 1));
    const parsedMinDelay = Math.max(0, Math.min(300, Number(min_delay_seconds) ?? 3));
    const parsedMaxDelay = Math.max(parsedMinDelay, Math.min(600, Number(max_delay_seconds) ?? 15));
    const parsedBatchSize = Math.max(1, Math.min(500, Number(batch_size) || 10));
    const parsedBatchPause = Math.max(0, Math.min(600, Number(batch_pause_seconds) ?? 30));
    const parsedScheduleEnabled = schedule_enabled !== undefined ? (schedule_enabled ? 1 : 0) : 1;
    
    // Intervalo em segundos (mínimo 15s para estabilidade na WAN e evitar falsos positivos)
    const rawSeconds = Number(schedule_interval_seconds) || (Number(schedule_interval_minutes) ? Number(schedule_interval_minutes) * 60 : 15);
    const parsedScheduleIntervalSeconds = Math.max(15, Math.min(86400, rawSeconds));
    const parsedScheduleIntervalMinutes = Math.max(1, Math.round(parsedScheduleIntervalSeconds / 60));

    const pool = getDbPool();

    // Garante que as colunas de agendamento existem se a migration não tiver sido aplicada
    try {
      await pool.execute(
        `ALTER TABLE workers 
         ADD COLUMN schedule_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER batch_pause_seconds,
         ADD COLUMN schedule_interval_seconds INT NOT NULL DEFAULT 30 AFTER schedule_enabled,
         ADD COLUMN schedule_interval_minutes INT NOT NULL DEFAULT 5 AFTER schedule_interval_seconds`
      );
    } catch {
      // Colunas já existem
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE workers 
       SET concurrency = ?,
           min_delay_seconds = ?,
           max_delay_seconds = ?,
           batch_size = ?,
           batch_pause_seconds = ?,
           schedule_enabled = ?,
           schedule_interval_seconds = ?,
           schedule_interval_minutes = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        parsedConcurrency,
        parsedMinDelay,
        parsedMaxDelay,
        parsedBatchSize,
        parsedBatchPause,
        parsedScheduleEnabled,
        parsedScheduleIntervalSeconds,
        parsedScheduleIntervalMinutes,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Worker não encontrado para atualização" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Configurações do worker salvas com sucesso.",
      worker: {
        id,
        concurrency: parsedConcurrency,
        min_delay_seconds: parsedMinDelay,
        max_delay_seconds: parsedMaxDelay,
        batch_size: parsedBatchSize,
        batch_pause_seconds: parsedBatchPause,
        schedule_enabled: Boolean(parsedScheduleEnabled),
        schedule_interval_seconds: parsedScheduleIntervalSeconds,
        schedule_interval_minutes: parsedScheduleIntervalMinutes,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar configurações do worker:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configurações do worker" },
      { status: 500 }
    );
  }
}
