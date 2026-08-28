import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { readHealthSnapshotFromFile } = await import("@/lib/health-snapshot");
    const fileSnap = readHealthSnapshotFromFile();

    // Se o snapshot tiver menos de 15 segundos, usa seus dados
    if (fileSnap && fileSnap.updated_at) {
      const snapAgeMs = Date.now() - new Date(fileSnap.updated_at).getTime();
      if (snapAgeMs < 15000) {
        const isDbOffline = fileSnap.db_status === "offline";
        const isConnected = !isDbOffline && fileSnap.whatsapp_status === "connected";
        return NextResponse.json({
          hasInstance: true,
          status: isConnected ? "connected" : (fileSnap.whatsapp_status === "connecting" ? "connecting" : "disconnected"),
          instance: {
            name: "Matriz SaaS",
            status: isDbOffline ? "disconnected" : fileSnap.whatsapp_status,
            phone_connected: isConnected ? fileSnap.whatsapp_phone : null,
            profile_name: isDbOffline ? "Serviço Comprometido" : (isConnected ? (fileSnap.whatsapp_profile || "WhatsApp Central") : "Desconectado"),
          },
        });
      }
    }

    const pool = getDbPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, status, phone_connected, profile_name FROM instances WHERE is_default = TRUE LIMIT 1"
    );

    if (rows.length > 0) {
      const snap = rows[0];
      const isConnected = snap.status === "connected";
      return NextResponse.json({
        hasInstance: true,
        status: isConnected ? "connected" : (snap.status === "connecting" ? "connecting" : "disconnected"),
        instance: {
          name: snap.name || "Matriz SaaS",
          status: snap.status,
          phone_connected: isConnected ? snap.phone_connected : null,
          profile_name: isConnected ? (snap.profile_name || "WhatsApp Central") : "Desconectado",
        },
      });
    }

    return NextResponse.json({
      hasInstance: false,
      status: "disconnected",
      instance: null,
    });
  } catch {
    return NextResponse.json({
      hasInstance: false,
      status: "disconnected",
      instance: null,
    });
  }
}
