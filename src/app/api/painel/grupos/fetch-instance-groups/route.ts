import { NextRequest, NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { getEvolutionConfig } from "@/lib/evolution";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const cookieStore = request.cookies;
    const impersonateCompanyId = cookieStore.get("company_id")?.value;
    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);

    const pool = getDbPool();

    // 1. Obter a instância conectada da empresa
    const [instances] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM instances WHERE company_id = ? AND status = 'connected' ORDER BY is_default DESC, id DESC LIMIT 1`,
      [companyId]
    );

    let instance = instances[0];

    // Se não tiver conectada, pega qualquer instância da empresa para tentar
    if (!instance) {
      const [allInstances] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM instances WHERE company_id = ? ORDER BY is_default DESC, id DESC LIMIT 1`,
        [companyId]
      );
      instance = allInstances[0];
    }

    if (!instance || !instance.name) {
      return NextResponse.json({
        success: false,
        message: "Nenhuma instância do WhatsApp vinculada a esta empresa encontrada.",
        groups: [],
        instance: null,
      });
    }

    // 2. Buscar grupos cadastrados no banco para saber quais já foram adicionados
    const [savedGroups] = await pool.query<RowDataPacket[]>(
      `SELECT id, whatsapp_group_id, name, status FROM company_whatsapp_groups WHERE company_id = ?`,
      [companyId]
    );

    const savedJids = new Set(
      savedGroups
        .map((g) => g.whatsapp_group_id)
        .filter(Boolean)
    );

    // 3. Chamar Evolution API v2.3.7 para buscar os grupos da instância com participantes para obter isAdmin
    const { url, apiKey } = getEvolutionConfig();
    const endpoint = `${url}/group/fetchAllGroups/${instance.name}?getParticipants=true`;

    try {
      const res = await fetch(endpoint, {
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[Evolution fetchAllGroups] Erro ${res.status}:`, errorText);
        return NextResponse.json({
          success: false,
          message: `Falha ao carregar grupos da Evolution API (HTTP ${res.status}). Verifique se o WhatsApp está conectado.`,
          groups: [],
          instance: { id: instance.id, name: instance.name, status: instance.status },
        });
      }

      const data = await res.json();
      const rawGroups = Array.isArray(data) ? data : data?.response || [];

      // Formatar e filtrar apenas grupos abertos (announce: false)
      const formattedGroups = rawGroups
        .filter((g: any) => {
          // No WhatsApp Baileys: announce = true significa grupo fechado (apenas admins enviam).
          // Se announce for false, falsy ou ausente, o grupo é aberto para todos enviarem mensagem.
          const isClosed = g.announce === true || g.announce === "true" || g.announce === 1;
          return !isClosed;
        })
        .map((g: any) => {
          const jid = g.id || g.jid || "";
          const subject = g.subject || g.name || "Grupo sem nome";
          const isAlreadyAdded = savedJids.has(jid);
          const participants = Array.isArray(g.participants) ? g.participants.length : (g.size || 0);

          // Identifica se a instância é admin do grupo
          let isAdmin = false;
          if (g.admin === true || g.is_admin === true || g.isAdmin === true || g.isSuperAdmin === true || g.isSuperadmin === true) {
            isAdmin = true;
          } else if (Array.isArray(g.participants)) {
            const cleanConnected = instance.phone_connected ? String(instance.phone_connected).replace(/\D/g, "") : "";
            const myParticipant = g.participants.find((p: any) => {
              const pId = String(p.id || p.jid || "").replace(/\D/g, "");
              if (p.isSuperAdmin || p.isAdmin || p.admin === "admin" || p.admin === "superadmin" || p.admin === true) {
                if (cleanConnected && pId.includes(cleanConnected)) {
                  return true;
                }
              }
              return false;
            });
            if (myParticipant) {
              isAdmin = true;
            }
          }

          return {
            id: jid,
            jid,
            name: subject,
            subject,
            description: g.desc || g.description || "",
            creation: g.creation || null,
            owner: g.owner || "",
            participants_count: participants,
            picture_url: g.pictureUrl || null,
            is_admin: isAdmin,
            restrict: Boolean(g.restrict),
            announce: false, // Garantido grupo aberto
            is_already_added: isAlreadyAdded,
          };
        });

      return NextResponse.json({
        success: true,
        instance: {
          id: instance.id,
          name: instance.name,
          status: instance.status,
          phone_connected: instance.phone_connected,
        },
        groups: formattedGroups,
      });
    } catch (evoErr: any) {
      console.error("Erro ao comunicar com Evolution API:", evoErr);
      return NextResponse.json({
        success: false,
        message: `Não foi possível conectar à Evolution API: ${evoErr.message || "Timeout"}`,
        groups: [],
        instance: { id: instance.id, name: instance.name, status: instance.status },
      });
    }
  } catch (error: any) {
    console.error("Erro ao listar grupos da instância:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao listar grupos da instância." },
      { status: 500 }
    );
  }
}
