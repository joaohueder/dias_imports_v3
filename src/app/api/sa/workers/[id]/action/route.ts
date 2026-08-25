import { NextRequest, NextResponse } from "next/server";
import { requireSaPermission } from "@/lib/server-permissions";
import { getDbPool } from "@/lib/db";

export async function POST(
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
    const { action } = body; // "start" | "pause" | "restart"

    if (!["start", "pause", "restart"].includes(action)) {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    const pool = getDbPool();
    const newStatus = action === "start" ? "active" : action === "pause" ? "paused" : "active";

    // Atualiza o estado real do worker no banco de dados
    await pool.execute(
      `UPDATE workers 
       SET status = ?, last_heartbeat_at = NOW(), uptime_seconds = CASE WHEN ? = 'restart' THEN 0 ELSE uptime_seconds END
       WHERE id = ?`,
      [newStatus, action, id]
    );

    return NextResponse.json({
      success: true,
      message: `Comando '${action}' aplicado com sucesso ao worker '${id}'.`,
      workerId: id,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao executar ação no worker:", error);
    return NextResponse.json(
      { error: "Erro ao processar ação no worker" },
      { status: 500 }
    );
  }
}
