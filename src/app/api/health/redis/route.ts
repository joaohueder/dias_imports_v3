import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { readHealthSnapshotFromFile } = await import("@/lib/health-snapshot");
    const fileSnap = readHealthSnapshotFromFile();

    // Se o arquivo tiver menos de 15 segundos, usa os dados do snapshot
    if (fileSnap && fileSnap.updated_at) {
      const snapAgeMs = Date.now() - new Date(fileSnap.updated_at).getTime();
      if (snapAgeMs < 15000) {
        const isDbOffline = fileSnap.db_status === "offline";
        return NextResponse.json({
          status: isDbOffline ? "offline" : fileSnap.redis_status,
          host: process.env.REDIS_HOST || "127.0.0.1",
          port: Number(process.env.REDIS_PORT) || 6379,
          latencyMs: fileSnap.redis_latency_ms,
          message: isDbOffline ? "Comprometido por indisponibilidade do banco" : undefined,
          timestamp: fileSnap.updated_at,
        });
      }
    }

    // Probe TCP direto no Redis com retentativa contra micro-instabilidades de WAN
    const host = process.env.REDIS_HOST || "127.0.0.1";
    const port = Number(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || "";
    const net = await import("net");

    const singleProbe = () => {
      const t0 = Date.now();
      return new Promise<number>((resolve, reject) => {
        const s = net.createConnection(port, host);
        s.setTimeout(2500);
        s.setNoDelay(true);

        s.on("connect", () => {
          if (password) {
            s.write(`AUTH ${password}\r\n`);
          } else {
            s.write("PING\r\n");
          }
        });

        s.on("data", (data) => {
          const resStr = data.toString();
          if (resStr.includes("+OK")) {
            s.write("PING\r\n");
          } else if (resStr.includes("+PONG")) {
            const latency = Date.now() - t0;
            s.end();
            resolve(latency);
          } else if (resStr.includes("-ERR") || resStr.includes("-NOAUTH")) {
            s.end();
            reject(new Error(resStr.trim()));
          }
        });

        s.on("error", (e) => {
          s.destroy();
          reject(e);
        });
        s.on("timeout", () => {
          s.destroy();
          reject(new Error("Timeout"));
        });
      });
    };

    let latencyMs = 0;
    try {
      // 1 tentativa + 1 retentativa de tolerância (elimina falsos positivos de jitter na rede)
      try {
        latencyMs = await singleProbe();
      } catch {
        await new Promise((r) => setTimeout(r, 100));
        latencyMs = await singleProbe();
      }

      return NextResponse.json({
        status: "online",
        host,
        port,
        latencyMs,
        timestamp: new Date().toISOString(),
      });
    } catch {
      return NextResponse.json({
        status: "offline",
        host,
        port,
        latencyMs: 0,
        message: "Conexão com o servidor Redis recusada ou expirada",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: "offline",
        message: "Erro ao verificar status do Redis",
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
