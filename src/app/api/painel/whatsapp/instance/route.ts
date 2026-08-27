import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";
import {
  connectEvolutionInstance,
  restartEvolutionInstance,
  getEvolutionConfig,
} from "@/lib/evolution";

export const dynamic = "force-dynamic";

// GET - Listar/Obter a instância da empresa logada e métricas de quotas/limites
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const impersonateCompanyId = cookieStore.get("company_id")?.value;

    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado." }, { status: 401 });
    }

    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);
    const pool = getDbPool();

    // 1. Busca instâncias da empresa
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM instances WHERE company_id = ? ORDER BY is_default DESC, id DESC`,
      [companyId]
    );

    let instance = rows[0] || null;

    // 2. Busca dados de assinatura ativa e limites do plano contratado
    const [companies] = await pool.query<RowDataPacket[]>(
      `SELECT 
         c.*, 
         COALESCE(sub.plan_snapshot_name, p.name, c.plan) as current_plan_name,
         sub.status as subscription_status,
         sub.current_period_start,
         sub.current_period_end,
         COALESCE(sub.plan_snapshot_max_groups, p.max_groups, 0) as quota_max_groups,
         COALESCE(sub.plan_snapshot_max_products, p.max_products, 0) as quota_max_products,
         COALESCE(sub.plan_snapshot_max_messages_day, p.max_messages_day, c.max_messages_day, 1000) as quota_max_messages_day,
         COALESCE(sub.plan_snapshot_max_instances, p.max_instances, c.max_instances, 1) as quota_max_instances
       FROM companies c 
       LEFT JOIN (
         SELECT s1.*
         FROM subscriptions s1
         INNER JOIN (
           SELECT company_id, MAX(id) as max_id
           FROM subscriptions
           WHERE status = 'active'
           GROUP BY company_id
         ) s2 ON s1.id = s2.max_id
       ) sub ON sub.company_id = c.id
       LEFT JOIN plans p ON sub.plan_id = p.id
       WHERE c.id = ? 
       GROUP BY c.id, sub.id, sub.plan_snapshot_name, sub.status, sub.current_period_start, sub.current_period_end, sub.plan_snapshot_max_groups, sub.plan_snapshot_max_products, sub.plan_snapshot_max_messages_day, sub.plan_snapshot_max_instances, p.name, p.max_groups, p.max_products, p.max_messages_day, p.max_instances`,
      [companyId]
    );
    const company = companies[0] || null;

    // 3. Sincroniza status em tempo real com Evolution API se houver instância
    let totalGroups = 0;

    // Buscar quantidade de grupos cadastrados no banco da empresa
    const [savedGroupsCount] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM company_whatsapp_groups WHERE company_id = ?`,
      [companyId]
    );
    if (savedGroupsCount.length > 0) {
      totalGroups = Number(savedGroupsCount[0].total) || 0;
    }

    if (instance && instance.name) {
      try {
        const { url, apiKey } = getEvolutionConfig();
        const listRes = await fetch(`${url}/instance/fetchInstances`, {
          headers: { apikey: apiKey },
          signal: AbortSignal.timeout(4000),
        });
        if (listRes.ok) {
          const list = await listRes.json();
          const evoInst = Array.isArray(list) ? list.find((i: Record<string, unknown>) => i.name === instance.name) : null;

          if (evoInst) {
            const rawStatus = String(evoInst.connectionStatus || "").toLowerCase();
            let newStatus = instance.status;
            let phoneConnected = instance.phone_connected;
            let profileName = instance.profile_name;
            let profilePic = instance.profile_picture_url;

            if (rawStatus === "open" || rawStatus === "connected") {
              newStatus = "connected";
              if (evoInst.ownerJid) {
                const cleanOwner = String(evoInst.ownerJid).split("@")[0].split(":")[0];
                if (cleanOwner && /^\d+$/.test(cleanOwner)) {
                  phoneConnected = cleanOwner;
                }
              }
              if (evoInst.profileName) profileName = String(evoInst.profileName);
              if (evoInst.profilePicUrl) profilePic = String(evoInst.profilePicUrl);
            } else if (rawStatus === "close" || rawStatus === "closed" || rawStatus === "disconnected") {
              newStatus = "disconnected";
            }

            if (newStatus !== instance.status || phoneConnected !== instance.phone_connected) {
              await pool.query(
                "UPDATE instances SET status = ?, phone_connected = ?, profile_name = ?, profile_picture_url = ?, updated_at = NOW() WHERE id = ?",
                [newStatus, phoneConnected, profileName, profilePic, instance.id]
              );
              instance.status = newStatus;
              instance.phone_connected = phoneConnected;
              instance.profile_name = profileName;
              instance.profile_picture_url = profilePic;
            }
          }
        }

        // Se conectado e não tiver grupos cadastrados localmente, busca da Evolution como fallback
        if (instance.status === "connected" && totalGroups === 0) {
          try {
            const groupsRes = await fetch(`${url}/group/fetchAllGroups/${instance.name}?getParticipants=false`, {
              headers: { apikey: apiKey },
              signal: AbortSignal.timeout(4000),
            });
            if (groupsRes.ok) {
              const groupsData = await groupsRes.json();
              if (Array.isArray(groupsData)) {
                totalGroups = groupsData.length;
              }
            }
          } catch (e) {
            console.warn("Erro ao buscar grupos do WhatsApp:", e);
          }
        }
      } catch (err) {
        console.warn("Erro ao sincronizar status na Evolution:", err);
      }
    }

    // 4. Cálculos de Quotas e Limites
    const maxMessagesDay = Number(company?.quota_max_messages_day) || Number(company?.max_messages_day) || 1000;
    const maxGroups = Number(company?.quota_max_groups) ?? 10;
    const cycleDays = 30;
    const maxMessagesCycle = maxMessagesDay * cycleDays;

    // Mensagens enviadas no ciclo e hoje (baseado na instância)
    const messagesCycle = Number(instance?.total_messages_sent) || 0;
    // Como a contagem hoje é derivada de registros recentes, usamos o valor proporcional/recente da instância
    const messagesToday = Math.min(messagesCycle, Number(instance?.total_messages_sent) || 0);

    return NextResponse.json({
      success: true,
      hasInstance: !!instance,
      instance,
      instances: rows,
      company,
      metrics: {
        messagesCycle: {
          sent: messagesCycle,
          limit: maxMessagesCycle,
          unlimited: maxMessagesDay === 0,
        },
        messagesToday: {
          sent: messagesToday,
          limit: maxMessagesDay,
          unlimited: maxMessagesDay === 0,
        },
        groups: {
          total: totalGroups,
          limit: maxGroups,
          unlimited: maxGroups === 0,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao buscar instância da empresa." },
      { status: 500 }
    );
  }
}
