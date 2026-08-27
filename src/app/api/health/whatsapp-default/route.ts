import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";
import { getEvolutionConfig } from "@/lib/evolution";

export const dynamic = "force-dynamic";

interface InstanceRow extends RowDataPacket {
  id: number;
  name: string;
  status: string;
  phone_connected: string | null;
  profile_name: string | null;
  is_default: number | boolean;
}

export async function GET() {
  try {
    await initAuthDatabase();
    const pool = getDbPool();

    const [rows] = await pool.query<InstanceRow[]>(
      `SELECT * FROM instances WHERE is_default = TRUE LIMIT 1`
    );

    if (rows.length === 0) {
      return NextResponse.json({
        hasInstance: false,
        status: "no_instance",
        instance: null,
      });
    }

    const inst = rows[0];
    let isConnected = inst.status === "connected";
    let phoneConnected = inst.phone_connected;
    let profileName = inst.profile_name;
    let stateName = inst.status;

    // Sincroniza rapidamente com a Evolution API se configurada
    try {
      const { url, apiKey } = getEvolutionConfig();
      if (url && apiKey) {
        const listRes = await fetch(`${url}/instance/fetchInstances`, {
          headers: { apikey: apiKey },
          signal: AbortSignal.timeout(4000),
        });

        if (listRes.ok) {
          const list = await listRes.json();
          const evoInst = Array.isArray(list)
            ? list.find((i: Record<string, unknown>) => i.name === inst.name)
            : null;

          if (evoInst) {
            const rawStatus = String(evoInst.connectionStatus || "").toLowerCase();
            if (rawStatus === "open" || rawStatus === "connected") {
              isConnected = true;
              stateName = "connected";

              if (evoInst.ownerJid) {
                const cleanOwner = String(evoInst.ownerJid).split("@")[0].split(":")[0];
                if (cleanOwner && /^\d+$/.test(cleanOwner)) {
                  phoneConnected = cleanOwner;
                }
              }
              if (evoInst.profileName) {
                profileName = String(evoInst.profileName);
              }
            } else if (rawStatus === "close" || rawStatus === "closed" || rawStatus === "disconnected") {
              isConnected = false;
              stateName = "disconnected";
            }
          }
        }
      }
    } catch {}

    return NextResponse.json({
      hasInstance: true,
      status: isConnected ? "connected" : "disconnected",
      instance: {
        id: inst.id,
        name: inst.name,
        status: stateName,
        phone_connected: phoneConnected,
        profile_name: profileName,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao checar status do WhatsApp";
    return NextResponse.json(
      {
        hasInstance: false,
        status: "disconnected",
        error: message,
      },
      { status: 200 }
    );
  }
}
