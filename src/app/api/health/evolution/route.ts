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
        const status = isDbOffline ? "offline" : fileSnap.evolution_status;
        return NextResponse.json({
          status,
          url: process.env.EVOLUTION_API_URL || "Não configurada",
          httpStatus: status === "online" ? 200 : 503,
          latencyMs: 0,
          version: "2.3.7",
          message: isDbOffline ? "Comprometido por indisponibilidade do banco" : undefined,
          timestamp: fileSnap.updated_at,
        });
      }
    }

    // Probe HTTP direto e em tempo real na Evolution API (timeout 3s)
    const { getEvolutionConfig } = await import("@/lib/evolution");
    const { url, apiKey } = getEvolutionConfig();

    if (!url || !apiKey) {
      return NextResponse.json({
        status: "offline",
        url: url || "Não configurada",
        httpStatus: 503,
        latencyMs: 0,
        version: "2.3.7",
        message: "Configuração da Evolution API ausente",
        timestamp: new Date().toISOString(),
      });
    }

    const t0 = Date.now();
    try {
      const evoRes = await fetch(`${url}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(3000),
      });

      const latencyMs = Date.now() - t0;
      const status = evoRes.ok ? "online" : "degraded";

      return NextResponse.json({
        status,
        url,
        httpStatus: evoRes.status,
        latencyMs,
        version: "2.3.7",
        timestamp: new Date().toISOString(),
      });
    } catch {
      return NextResponse.json({
        status: "offline",
        url,
        httpStatus: 503,
        latencyMs: 0,
        version: "2.3.7",
        message: "Conexão com a Evolution API recusada ou expirada",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: "offline",
        url: process.env.EVOLUTION_API_URL || "Não configurada",
        latencyMs: 0,
        message: "Erro ao verificar status da Evolution API",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
