import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";
import { createEvolutionInstance, getEvolutionConfig } from "@/lib/evolution";
import crypto from "crypto";

export const dynamic = "force-dynamic";

interface InstanceRow extends RowDataPacket {
  id: number;
  company_id: number;
  company_name: string;
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
  total_messages_sent: number;
  total_messages_received: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

// GET - Listar todas as instâncias com filtros
export async function GET(request: Request) {
  try {
    const auth = await requireSaPermission("instances", "view");
    if (!auth.authorized) return auth.response;

    try {
      await initAuthDatabase();
    } catch (dbInitErr) {
      console.warn("Aviso ao inicializar DB em instances GET:", dbInitErr);
    }

    const pool = getDbPool();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const status = searchParams.get("status") || "all";
    const companyId = searchParams.get("company_id") || "all";

    let query = `
      SELECT 
        i.id,
        i.company_id,
        c.name as company_name,
        c.trade_name as company_trade_name,
        i.name,
        i.whatsapp_number,
        i.server_url,
        i.instance_key,
        i.status,
        i.phone_connected,
        i.profile_name,
        i.profile_picture_url,
        i.battery_level,
        i.is_charging,
        i.total_messages_sent,
        i.total_messages_received,
        i.last_activity_at,
        i.created_at,
        i.updated_at
      FROM instances i
      INNER JOIN companies c ON i.company_id = c.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (search) {
      query += ` AND (LOWER(i.name) LIKE ? OR LOWER(i.instance_key) LIKE ? OR LOWER(i.whatsapp_number) LIKE ? OR LOWER(c.name) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== "all") {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    if (companyId && companyId !== "all") {
      query += ` AND i.company_id = ?`;
      params.push(Number(companyId));
    }

    query += ` ORDER BY i.created_at DESC`;

    const [rows] = await pool.query<InstanceRow[]>(query, params);

    // Sincronizar com a Evolution API caso alguma instância esteja aberta no servidor
    try {
      const { url, apiKey } = getEvolutionConfig();
      const evoRes = await fetch(`${url}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
      });
      if (evoRes.ok) {
        const evoList = await evoRes.json();
        if (Array.isArray(evoList)) {
          for (const row of rows) {
            const matched = evoList.find((e: Record<string, unknown>) => e.name === row.name);
            if (matched) {
              const evoStatus = String(matched.connectionStatus || "").toLowerCase();
              const isEvoOpen = evoStatus === "open" || evoStatus === "connected";
              const currentStatus = isEvoOpen ? "connected" : (evoStatus === "close" ? "disconnected" : row.status);
              
              let owner = row.phone_connected;
              if (matched.ownerJid) {
                const cleanOwner = String(matched.ownerJid).split("@")[0].split(":")[0];
                if (cleanOwner && /^\d+$/.test(cleanOwner)) {
                  owner = cleanOwner;
                }
              }

              const pic = (matched.profilePicUrl as string) || row.profile_picture_url;
              const pName = (matched.profileName as string) || row.profile_name;

              if (row.status !== currentStatus || row.phone_connected !== owner || row.profile_picture_url !== pic || row.profile_name !== pName) {
                row.status = currentStatus as InstanceRow["status"];
                row.phone_connected = owner;
                row.profile_picture_url = pic;
                row.profile_name = pName;

                // Atualizar no banco de dados em background
                await pool.query<ResultSetHeader>(
                  `UPDATE instances 
                   SET status = ?, 
                       phone_connected = ?, 
                       profile_picture_url = ?, 
                       profile_name = ?,
                       qrcode_base64 = CASE WHEN ? = 'connected' THEN NULL ELSE qrcode_base64 END
                   WHERE id = ?`,
                  [currentStatus, owner, pic, pName, currentStatus, row.id]
                );
              }
            }
          }
        }
      }
    } catch (evoSyncErr) {
      console.warn("Aviso ao sincronizar instâncias com a Evolution API:", evoSyncErr);
    }

    return NextResponse.json({
      success: true,
      instances: rows,
      total: rows.length,
    });
  } catch (error: unknown) {
    console.error("Erro na rota GET /api/sa/instances:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao listar instâncias WhatsApp" },
      { status: 500 }
    );
  }
}

// POST - Criar nova instância para uma empresa
export async function POST(request: Request) {
  try {
    const auth = await requireSaPermission("instances", "create");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();
    const body = await request.json();

    const {
      company_id,
      name,
      whatsapp_number,
      server_url,
      api_key,
    } = body;

    if (!company_id || !name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Empresa e Nome da Instância são obrigatórios." },
        { status: 400 }
      );
    }

    // Verificar existência e cotas da empresa
    const [compRows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.name, c.max_instances,
        COALESCE(sub.plan_snapshot_max_instances, p.max_instances, c.max_instances) as quota_max_instances
       FROM companies c
       LEFT JOIN (
         SELECT s1.* FROM subscriptions s1
         INNER JOIN (SELECT company_id, MAX(id) as max_id FROM subscriptions GROUP BY company_id) s2 
         ON s1.company_id = s2.company_id AND s1.id = s2.max_id
       ) sub ON sub.company_id = c.id
       LEFT JOIN plans p ON sub.plan_id = p.id
       WHERE c.id = ? LIMIT 1`,
      [Number(company_id)]
    );

    if (compRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Empresa informada não foi encontrada." },
        { status: 404 }
      );
    }

    const company = compRows[0];
    const maxQuota = Number(company.quota_max_instances || company.max_instances || 1);

    // Regra: cada empresa pode ter no máximo 1 instância
    const [countRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM instances WHERE company_id = ?",
      [Number(company_id)]
    );
    const currentInstances = Number(countRows[0]?.total || 0);

    if (currentInstances >= 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta empresa já possui uma instância cadastrada. O sistema permite no máximo 1 instância por empresa.",
        },
        { status: 400 }
      );
    }

    // Gerar chave única para a instância
    const instanceKey = `inst_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const cleanInstanceName = name.trim();

    // 1. Chamar a Evolution API v2.3.7 para criar a instância no servidor WhatsApp
    const evoResult = await createEvolutionInstance({
      instanceName: cleanInstanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    });

    if (!evoResult.ok) {
      console.warn("Aviso: Evolution API retornou erro ao criar instância:", evoResult.data);
      // Se a instância já existir na Evolution ou outro erro tratável
      const evoErrorMsg = (evoResult.data as Record<string, unknown>)?.response?.toString() 
        || (evoResult.data as Record<string, unknown>)?.message?.toString() 
        || (evoResult.data as Record<string, unknown>)?.error?.toString() 
        || "Erro ao criar instância no servidor Evolution API";

      // Se não for conflito aceitável, podemos retornar erro ou salvar com aviso
      if (evoResult.status !== 403 && evoResult.status !== 409 && evoResult.status !== 400) {
        return NextResponse.json(
          {
            success: false,
            error: `Falha ao criar instância na Evolution API: ${evoErrorMsg}`,
          },
          { status: 502 }
        );
      }
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO instances (
        company_id, name, whatsapp_number, server_url, api_key, instance_key, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'disconnected')`,
      [
        Number(company_id),
        cleanInstanceName,
        whatsapp_number ? String(whatsapp_number).trim() : null,
        server_url ? String(server_url).trim() : null,
        api_key ? String(api_key).trim() : null,
        instanceKey,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Instância criada com sucesso na plataforma e na Evolution API!",
      instanceId: result.insertId,
      instanceKey,
      evolution: evoResult.data,
    });
  } catch (error: unknown) {
    console.error("Erro na rota POST /api/sa/instances:", error);
    const msg = error instanceof Error ? error.message : "Erro ao criar instância";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
