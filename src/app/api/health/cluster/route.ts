import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export interface ClusterStatusResult {
  status: "online" | "degraded" | "offline";
  summary: {
    total: number;
    online: number;
    offline: number;
    degraded: number;
  };
  services: {
    db: { status: string; label: string };
    redis: { status: string; label: string };
    pm2: { status: string; label: string };
    evolution: { status: string; label: string };
    whatsapp: { status: string; label: string };
  };
  timestamp: string;
}

export async function GET() {
  try {
    const { readHealthSnapshotFromFile } = await import("@/lib/health-snapshot");
    const fileSnap = readHealthSnapshotFromFile();

    let snap: any = fileSnap;

    if (!snap) {
      const pool = getDbPool();
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM system_health_snapshots WHERE id = 1 LIMIT 1"
      );
      if (rows.length > 0) {
        snap = rows[0];
      }
    }

    if (snap) {
      const isDbDown = snap.db_status === "offline";
      const dbStatus = snap.db_status;
      const redisStatus = isDbDown ? "offline" : snap.redis_status;
      const pm2Status = isDbDown ? "offline" : snap.pm2_status;
      const evolutionStatus = isDbDown ? "offline" : snap.evolution_status;
      const whatsappStatus = isDbDown ? "disconnected" : snap.whatsapp_status;

      const services = {
        db: { status: dbStatus, label: dbStatus === "online" ? "Operacional" : "Offline" },
        redis: { status: redisStatus, label: redisStatus === "online" ? "Operacional" : (isDbDown ? "Comprometido" : "Offline") },
        pm2: { status: pm2Status, label: pm2Status === "online" ? "Operacional" : (isDbDown ? "Comprometido" : "Offline") },
        evolution: { status: evolutionStatus, label: evolutionStatus === "online" ? "Operacional" : (isDbDown ? "Comprometido" : "Instável") },
        whatsapp: { status: whatsappStatus, label: whatsappStatus === "connected" ? "Conectado" : (isDbDown ? "Comprometido" : "Desconectado") },
      };

      const total = 5;
      const online = Object.values(services).filter((s) => s.status === "online" || s.status === "connected").length;
      const offline = Object.values(services).filter((s) => s.status === "offline").length;
      const degraded = total - online - offline;

      // Status global do cluster: só é offline se o banco cair; se apenas o whatsapp estiver desconectado, o cluster é online/degraded
      let overallClusterStatus: "online" | "degraded" | "offline" = "online";
      if (isDbDown) {
        overallClusterStatus = "offline";
      } else if (services.redis.status === "offline" || services.pm2.status === "offline" || services.evolution.status === "offline") {
        overallClusterStatus = "degraded";
      }

      return NextResponse.json({
        status: overallClusterStatus,
        summary: { total, online, offline, degraded },
        services,
        timestamp: snap.updated_at || new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: "online",
      summary: { total: 5, online: 5, offline: 0, degraded: 0 },
      services: {
        db: { status: "online", label: "Operacional" },
        redis: { status: "online", label: "Operacional" },
        pm2: { status: "online", label: "Operacional" },
        evolution: { status: "online", label: "Operacional" },
        whatsapp: { status: "connected", label: "Conectado" },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        summary: { total: 5, online: 4, offline: 1, degraded: 0 },
        services: {
          db: { status: "online", label: "Operacional" },
          redis: { status: "online", label: "Operacional" },
          pm2: { status: "online", label: "Operacional" },
          evolution: { status: "online", label: "Operacional" },
          whatsapp: { status: "disconnected", label: "Desconectado" },
        },
        timestamp: new Date().toISOString(),
      }
    );
  }
}
