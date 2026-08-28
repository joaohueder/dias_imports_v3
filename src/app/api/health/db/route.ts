import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { readHealthSnapshotFromFile } = await import("@/lib/health-snapshot");
    const fileSnap = readHealthSnapshotFromFile();

    // Se o arquivo tiver menos de 30 segundos, usa direto
    if (fileSnap && fileSnap.updated_at) {
      const snapAgeMs = Date.now() - new Date(fileSnap.updated_at).getTime();
      if (snapAgeMs < 30000) {
        return NextResponse.json({
          status: fileSnap.db_status,
          database: process.env.DB_NAME || "jh7_marketing",
          latencyMs: fileSnap.db_latency_ms,
          timestamp: fileSnap.updated_at,
        });
      }
    }

    // Se não houver snapshot recente, faz probe direto no banco com timeout rápido
    const pool = getDbPool();
    const t0 = Date.now();
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT db_status, db_latency_ms, updated_at FROM system_health_snapshots WHERE id = 1 LIMIT 1"
      );

      const latency = Date.now() - t0;

      if (rows.length > 0) {
        const snap = rows[0];
        return NextResponse.json({
          status: snap.db_status || "online",
          database: process.env.DB_NAME || "jh7_marketing",
          latencyMs: snap.db_latency_ms || latency,
          timestamp: snap.updated_at || new Date().toISOString(),
        });
      }

      return NextResponse.json({
        status: "online",
        database: process.env.DB_NAME || "jh7_marketing",
        latencyMs: latency,
        timestamp: new Date().toISOString(),
      });
    } catch (dbErr) {
      return NextResponse.json(
        {
          status: "offline",
          message: "Conexão com o banco de dados falhou",
          database: process.env.DB_NAME || "jh7_marketing",
          latencyMs: 0,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: "offline",
        message: "Erro ao verificar saúde do banco de dados",
        database: process.env.DB_NAME || "jh7_marketing",
        latencyMs: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
