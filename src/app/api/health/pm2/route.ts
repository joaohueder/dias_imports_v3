import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { readHealthSnapshotFromFile } = await import("@/lib/health-snapshot");
    const fileSnap = readHealthSnapshotFromFile();

    // Se o snapshot tiver menos de 15 segundos, usa os dados do snapshot
    if (fileSnap && fileSnap.updated_at) {
      const snapAgeMs = Date.now() - new Date(fileSnap.updated_at).getTime();
      if (snapAgeMs < 15000) {
        const isDbOffline = fileSnap.db_status === "offline";
        const status = isDbOffline ? "offline" : fileSnap.pm2_status;
        return NextResponse.json({
          status,
          latencyMs: 0,
          totalProcesses: 1,
          onlineProcesses: status === "online" ? 1 : 0,
          message: isDbOffline ? "Comprometido por indisponibilidade do banco" : undefined,
          timestamp: fileSnap.updated_at,
        });
      }
    }

    // Probe direto em tempo real no PM2
    const { isPm2DaemonRunning } = await import("@/lib/pm2");
    const isRunning = await isPm2DaemonRunning();
    const status = isRunning ? "online" : "offline";

    return NextResponse.json({
      status,
      latencyMs: 0,
      totalProcesses: 1,
      onlineProcesses: isRunning ? 1 : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: "offline",
        message: "Erro ao verificar status do PM2",
        latencyMs: 0,
        totalProcesses: 0,
        onlineProcesses: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
