import { NextRequest, NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { getCurrentSaUser } from "@/lib/session";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import {
  createEvolutionInstance,
  getEvolutionConfig,
  getConnectionStateEvolution,
  restartEvolutionInstance,
  logoutEvolutionInstance,
  deleteEvolutionInstance,
} from "@/lib/evolution";
import crypto from "crypto";

export const dynamic = "force-dynamic";

interface InstanceRow extends RowDataPacket {
  id: number;
  company_id: number;
  name: string;
  whatsapp_number: string | null;
  server_url: string | null;
  api_key: string | null;
  instance_key: string;
  status: "connected" | "connecting" | "disconnected" | "banned" | "qrcode";
  qrcode_base64: string | null;
  phone_connected: string | null;
  profile_name: string | null;
  profile_picture_url: string | null;
  battery_level: number | null;
  is_charging: boolean | null;
  is_default: boolean;
  total_messages_sent: number;
  total_messages_received: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

// Garantir que a coluna is_default exista
async function ensureDefaultColumnExists() {
  const pool = getDbPool();
  try {
    const [cols] = await pool.query<RowDataPacket[]>(
      "SHOW COLUMNS FROM instances LIKE 'is_default'"
    );
    if (cols.length === 0) {
      await pool.query(
        "ALTER TABLE instances ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE AFTER is_charging"
      );
      await pool.query("ALTER TABLE instances ADD INDEX idx_is_default (is_default)");
    }
  } catch (err) {
    console.warn("Aviso ao verificar coluna is_default:", err);
  }
}

// GET - Obter dados da instância padrão do sistema
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSaUser();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN") {
      const perms = session.permissions as Record<string, any> | undefined;
      const canView = Boolean(perms?.default_instance?.view || perms?.settings?.view);
      if (!canView) {
        return NextResponse.json(
          { error: "Acesso negado. Você não possui permissão para visualizar a instância padrão." },
          { status: 403 }
        );
      }
    }

    await initAuthDatabase();
    await ensureDefaultColumnExists();
    const pool = getDbPool();

    // 1. Buscar a instância marcada como is_default = TRUE
    const [rows] = await pool.query<InstanceRow[]>(
      `SELECT * FROM instances WHERE is_default = TRUE LIMIT 1`
    );

    if (rows.length === 0) {
      return NextResponse.json({
        hasInstance: false,
        instance: null,
      });
    }

    const inst = rows[0];

    // 2. Sincronizar status com a Evolution API via fetchInstances e connectionState
    try {
      const { url, apiKey } = getEvolutionConfig();
      let isConnected = inst.status === "connected";
      let phoneConnected = inst.phone_connected;
      let profileName = inst.profile_name;
      let profilePic = inst.profile_picture_url;
      let stateName = inst.status;

      // Consulta fetchInstances da Evolution API
      const listRes = await fetch(`${url}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
      });
      if (listRes.ok) {
        const list = await listRes.json();
        const evoInst = Array.isArray(list) ? list.find((i: Record<string, unknown>) => i.name === inst.name) : null;

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
            if (evoInst.profilePicUrl) {
              profilePic = String(evoInst.profilePicUrl);
            }
          } else if (rawStatus === "close" || rawStatus === "closed" || rawStatus === "disconnected") {
            isConnected = false;
            stateName = "disconnected";
          }
        }
      } else {
        // Fallback: connectionState
        const evoState = await getConnectionStateEvolution(inst.name);
        if (evoState.ok && evoState.data) {
          const stateStr = String(evoState.data.state || evoState.data.status || "").toLowerCase();
          if (stateStr === "open" || stateStr === "connected") {
            isConnected = true;
            stateName = "connected";
          } else if (stateStr === "close" || stateStr === "disconnected") {
            isConnected = false;
            stateName = "disconnected";
          }
        }
      }

      // Se conectado e ainda falta foto ou nome, tentar buscar via chat/fetchProfile
      if (isConnected && (!profilePic || !profileName)) {
        try {
          const profileRes = await fetch(`${url}/chat/fetchProfile/${inst.name}`, {
            method: "GET",
            headers: { apikey: apiKey },
          });

          if (profileRes.ok) {
            const pData = await profileRes.json();
            if (pData?.name || pData?.pushName) {
              profileName = profileName || pData.name || pData.pushName;
            }
            if (pData?.profilePictureUrl || pData?.picture) {
              profilePic = profilePic || pData.profilePictureUrl || pData.picture;
            }
          }
        } catch (profileErr) {
          console.warn(`Aviso ao buscar perfil WhatsApp (${inst.name}):`, profileErr);
        }
      }

      if (
        stateName !== inst.status ||
        phoneConnected !== inst.phone_connected ||
        profileName !== inst.profile_name ||
        profilePic !== inst.profile_picture_url
      ) {
        await pool.query(
          `UPDATE instances 
           SET status = ?, phone_connected = ?, profile_name = ?, profile_picture_url = ? 
           WHERE id = ?`,
          [stateName, phoneConnected, profileName, profilePic, inst.id]
        );
        inst.status = stateName;
        inst.phone_connected = phoneConnected;
        inst.profile_name = profileName;
        inst.profile_picture_url = profilePic;
      }
    } catch (evoErr) {
      console.warn("Aviso ao checar estado da instância padrão na Evolution API:", evoErr);
    }

    return NextResponse.json({
      hasInstance: true,
      instance: inst,
    });
  } catch (error: any) {
    console.error("Erro na rota GET /api/sa/settings/default-instance:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao buscar instância padrão" },
      { status: 500 }
    );
  }
}

// POST - Criar a instância padrão do sistema
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSaUser();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN") {
      const perms = session.permissions as Record<string, any> | undefined;
      const canCreate = Boolean(perms?.default_instance?.create);
      if (!canCreate) {
        return NextResponse.json(
          { error: "Acesso negado. Você não possui permissão para criar a instância padrão." },
          { status: 403 }
        );
      }
    }

    await initAuthDatabase();
    await ensureDefaultColumnExists();
    const pool = getDbPool();

    // Verificar se já existe uma instância padrão
    const [existing] = await pool.query<InstanceRow[]>(
      `SELECT id, name FROM instances WHERE is_default = TRUE LIMIT 1`
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Já existe uma instância padrão cadastrada no sistema. Exclua a atual para criar uma nova." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, whatsapp_number } = body;

    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const instanceName = (name && String(name).trim()) || `Instancia_Padrao_${randomSuffix}`;
    const instanceKey = `system_default_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    // 1. Criar na Evolution API v2.3.7
    const evoResult = await createEvolutionInstance({
      instanceName: instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    });

    if (!evoResult.ok) {
      console.warn("Aviso: Evolution API retornou erro ao criar instância padrão:", evoResult.data);
      const evoErrorMsg = (evoResult.data as Record<string, unknown>)?.response?.toString() 
        || (evoResult.data as Record<string, unknown>)?.message?.toString() 
        || (evoResult.data as Record<string, unknown>)?.error?.toString() 
        || "Erro ao criar instância padrão no servidor Evolution API";

      if (evoResult.status !== 403 && evoResult.status !== 409 && evoResult.status !== 400) {
        return NextResponse.json(
          { error: `Falha ao criar instância na Evolution API: ${evoErrorMsg}` },
          { status: 502 }
        );
      }
    }

    // 2. Inserir no banco de dados local com company_id = 0 e is_default = TRUE
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO instances (
        company_id, name, whatsapp_number, server_url, api_key, instance_key, status, is_default
      ) VALUES (0, ?, ?, NULL, NULL, ?, 'disconnected', TRUE)`,
      [
        instanceName,
        whatsapp_number ? String(whatsapp_number).trim() : null,
        instanceKey,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Instância padrão do sistema criada com sucesso!",
      instanceId: result.insertId,
    });
  } catch (error: any) {
    console.error("Erro na rota POST /api/sa/settings/default-instance:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao criar instância padrão" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir a instância padrão do sistema
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSaUser();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN") {
      const perms = session.permissions as Record<string, any> | undefined;
      const canDelete = Boolean(perms?.default_instance?.delete);
      if (!canDelete) {
        return NextResponse.json(
          { error: "Acesso negado. Você não possui permissão para excluir a instância padrão." },
          { status: 403 }
        );
      }
    }

    await initAuthDatabase();
    await ensureDefaultColumnExists();
    const pool = getDbPool();

    const [rows] = await pool.query<InstanceRow[]>(
      `SELECT * FROM instances WHERE is_default = TRUE LIMIT 1`
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma instância padrão encontrada para exclusão." },
        { status: 404 }
      );
    }

    const inst = rows[0];

    // Deletar na Evolution API
    try {
      await deleteEvolutionInstance(inst.name);
    } catch (evoErr) {
      console.warn("Aviso ao deletar instância padrão na Evolution API:", evoErr);
    }

    // Deletar do banco de dados
    await pool.query("DELETE FROM instances WHERE id = ?", [inst.id]);

    return NextResponse.json({
      success: true,
      message: "Instância padrão do sistema excluída com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro na rota DELETE /api/sa/settings/default-instance:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao excluir instância padrão" },
      { status: 500 }
    );
  }
}
