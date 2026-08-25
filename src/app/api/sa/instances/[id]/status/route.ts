import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";
import { getConnectionStateEvolution, getEvolutionConfig } from "@/lib/evolution";

export const dynamic = "force-dynamic";

// GET - Verifica o status da conexão em tempo real e atualiza os dados do perfil se conectado
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("instances", "view");
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const pool = getDbPool();

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM instances WHERE id = ? LIMIT 1",
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Instância não encontrada." },
        { status: 404 }
      );
    }

    const instance = rows[0];
    const instanceName = instance.name;

    let isConnected = instance.status === "connected";
    let phoneConnected = instance.phone_connected;
    let profileName = instance.profile_name;
    let profilePictureUrl = instance.profile_picture_url;
    let stateName = instance.status;

    if (instanceName) {
      // 1. Checa instâncias na Evolution API (fetchInstances traz status global e ownerJid)
      const { url, apiKey } = getEvolutionConfig();
      try {
        const listRes = await fetch(`${url}/instance/fetchInstances`, {
          headers: { apikey: apiKey },
        });
        if (listRes.ok) {
          const list = await listRes.json();
          const evoInst = Array.isArray(list) ? list.find((i: Record<string, unknown>) => i.name === instanceName) : null;

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
                profileName = evoInst.profileName;
              }
              if (evoInst.profilePicUrl) {
                profilePictureUrl = evoInst.profilePicUrl;
              }
            } else if (rawStatus === "close" || rawStatus === "closed" || rawStatus === "disconnected") {
              isConnected = false;
              stateName = "disconnected";
            }
          }
        }
      } catch (err) {
        console.warn("Erro ao buscar fetchInstances na Evolution:", err);
      }

      // 2. Se conectado e ainda falta foto ou nome, tentar buscar via chat/fetchProfile
      if (isConnected && (!profilePictureUrl || !profileName)) {
        try {
          const profileRes = await fetch(`${url}/chat/fetchProfile/${instanceName}`, {
            method: "GET",
            headers: { apikey: apiKey },
          });

          if (profileRes.ok) {
            const pData = await profileRes.json();
            if (pData?.name || pData?.pushName) {
              profileName = profileName || pData.name || pData.pushName;
            }
            if (pData?.profilePictureUrl || pData?.picture) {
              profilePictureUrl = profilePictureUrl || pData.profilePictureUrl || pData.picture;
            }
          }
        } catch (profileErr) {
          console.warn(`Aviso ao buscar perfil WhatsApp (${instanceName}):`, profileErr);
        }
      }
    }

    // Se conectado ou se o status mudou, atualiza no banco
    if (isConnected) {
      await pool.query<ResultSetHeader>(
        `UPDATE instances 
         SET status = 'connected',
             phone_connected = COALESCE(?, phone_connected),
             profile_name = COALESCE(?, profile_name),
             profile_picture_url = COALESCE(?, profile_picture_url),
             qrcode_base64 = NULL,
             last_activity_at = NOW()
         WHERE id = ?`,
        [phoneConnected, profileName, profilePictureUrl, Number(id)]
      );
    } else if (stateName === "disconnected" && instance.status === "connected") {
      await pool.query<ResultSetHeader>(
        `UPDATE instances 
         SET status = 'disconnected',
             phone_connected = NULL,
             profile_name = NULL,
             profile_picture_url = NULL,
             last_activity_at = NOW()
         WHERE id = ?`,
        [Number(id)]
      );
    }

    return NextResponse.json({
      success: true,
      connected: isConnected,
      status: stateName,
      instance: {
        id: instance.id,
        name: instance.name,
        status: stateName,
        phone_connected: phoneConnected,
        profile_name: profileName,
        profile_picture_url: profilePictureUrl,
      },
    });
  } catch (error: unknown) {
    console.error("Erro na rota GET /api/sa/instances/[id]/status:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao verificar status da instância" },
      { status: 500 }
    );
  }
}
