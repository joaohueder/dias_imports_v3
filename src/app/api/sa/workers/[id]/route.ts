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
    } = body;

    const parsedConcurrency = Math.max(1, Math.min(50, Number(concurrency) || 1));
    const parsedMinDelay = Math.max(0, Math.min(300, Number(min_delay_seconds) ?? 3));
    const parsedMaxDelay = Math.max(parsedMinDelay, Math.min(600, Number(max_delay_seconds) ?? 15));
    const parsedBatchSize = Math.max(1, Math.min(500, Number(batch_size) || 10));
    const parsedBatchPause = Math.max(0, Math.min(600, Number(batch_pause_seconds) ?? 30));

    const pool = getDbPool();

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE workers 
       SET concurrency = ?,
           min_delay_seconds = ?,
           max_delay_seconds = ?,
           batch_size = ?,
           batch_pause_seconds = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        parsedConcurrency,
        parsedMinDelay,
        parsedMaxDelay,
        parsedBatchSize,
        parsedBatchPause,
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
