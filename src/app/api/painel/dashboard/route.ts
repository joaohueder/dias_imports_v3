import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser, getEffectiveCompanyId } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Não autorizado." },
        { status: 401 }
      );
    }

    const companyId = (await getEffectiveCompanyId(user)) || user.company_id || 1;

    const pool = getDbPool();

    // Executa as consultas em paralelo para minimizar o tempo de resposta
    const [
      [companies],
      [instances],
      [users],
      [jobsTodayRows],
      [dailyJobsRows],
      [dailyLeadsRows],
      [topProducts],
      [topGroups],
      [recentLeads],
      [participantsSumRow],
    ] = await Promise.all([
      // 1. Dados da empresa (com plano e limites da assinatura ativa)
      pool.query<RowDataPacket[]>(
        `SELECT c.*, 
                COALESCE(
                  (SELECT p.name FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1),
                  c.plan,
                  'Personalizado'
                ) as current_plan_name,
                (SELECT s.status FROM subscriptions s WHERE s.company_id = c.id ORDER BY CASE WHEN s.status = 'active' THEN 1 ELSE 2 END, s.id DESC LIMIT 1) as sub_status,
                (SELECT s.current_period_end FROM subscriptions s WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as sub_period_end,
                (SELECT s.plan_snapshot_max_groups FROM subscriptions s WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as sub_max_groups,
                (SELECT s.plan_snapshot_max_products FROM subscriptions s WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as sub_max_products,
                (SELECT s.plan_snapshot_max_messages_day FROM subscriptions s WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as sub_max_messages_day,
                (SELECT s.plan_snapshot_max_views FROM subscriptions s WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as sub_max_views,
                (SELECT s.plan_snapshot_max_leads FROM subscriptions s WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as sub_max_leads,
                (SELECT p.max_groups FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as plan_max_groups,
                (SELECT p.max_products FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as plan_max_products,
                (SELECT p.max_messages_day FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as plan_max_messages_day,
                (SELECT p.max_views FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as plan_max_views,
                (SELECT p.max_leads FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1) as plan_max_leads,
                (SELECT COUNT(*) FROM company_whatsapp_groups WHERE company_id = c.id) as current_groups_count,
                (SELECT COUNT(*) FROM company_products WHERE company_id = c.id) as current_products_count,
                (SELECT COALESCE(SUM(views_count), 0) FROM company_products WHERE company_id = c.id) as current_views_count,
                (SELECT COUNT(*) FROM company_leads WHERE company_id = c.id) as current_leads_count,
                (SELECT COUNT(*) FROM instances WHERE company_id = c.id) as total_instances,
                (SELECT COUNT(*) FROM instances WHERE company_id = c.id AND status = 'connected') as connected_instances
         FROM companies c 
         WHERE c.id = ? 
         LIMIT 1`,
        [companyId]
      ),

      // 2. Instâncias da empresa
      pool.query<RowDataPacket[]>(
        `SELECT id, name, whatsapp_number, status, phone_connected, profile_name, 
                profile_picture_url, battery_level, is_charging, is_default, 
                total_messages_sent, total_messages_received, last_activity_at, updated_at
         FROM instances 
         WHERE company_id = ?
         ORDER BY is_default DESC, id DESC`,
        [companyId]
      ),

      // 3. Usuários da empresa
      pool.query<RowDataPacket[]>(
        `SELECT id, name, email, whatsapp, role, status, created_at 
         FROM users 
         WHERE company_id = ?
         ORDER BY role ASC, name ASC`,
        [companyId]
      ),

      // 4. Disparos hoje com índice temporal
      pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as sends_today
         FROM background_jobs
         WHERE queue_name LIKE 'whatsapp-messages%'
           AND (status = 'completed' OR status = 'active' OR status = 'waiting' OR status = 'delayed')
           AND created_at >= CURDATE()
           AND (
             JSON_UNQUOTE(JSON_EXTRACT(payload, '$.company_id')) = ? 
             OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.companyId')) = ?
           )`,
        [String(companyId), String(companyId)]
      ),

      // 5. Histórico dos últimos 7 dias de disparos
      pool.query<RowDataPacket[]>(
        `SELECT 
          DATE(created_at) as date_val,
          COUNT(*) as sends_count
         FROM background_jobs
         WHERE queue_name LIKE 'whatsapp-messages%'
           AND (status = 'completed' OR status = 'active' OR status = 'waiting' OR status = 'delayed')
           AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
           AND (
             JSON_UNQUOTE(JSON_EXTRACT(payload, '$.company_id')) = ? 
             OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.companyId')) = ?
           )
         GROUP BY DATE(created_at)
         ORDER BY date_val ASC`,
        [String(companyId), String(companyId)]
      ),

      // 5.1 Histórico dos últimos 7 dias de leads
      pool.query<RowDataPacket[]>(
        `SELECT 
          DATE(created_at) as date_val,
          COUNT(*) as leads_count
         FROM company_leads
         WHERE company_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY DATE(created_at)
         ORDER BY date_val ASC`,
        [companyId]
      ),

      // 6. Top Produtos
      pool.query<RowDataPacket[]>(
        `SELECT id, name, slug, price, promo_price, cover_image, sends_count, clicks_count, views_count, status, created_at
         FROM company_products 
         WHERE company_id = ? AND is_archived = 0
         ORDER BY views_count DESC, clicks_count DESC, id DESC
         LIMIT 6`,
        [companyId]
      ),

      // 7. Top Grupos
      pool.query<RowDataPacket[]>(
        `SELECT id, name, whatsapp_group_id, participants_count, group_type, status, can_send_messages, updated_at
         FROM company_whatsapp_groups
         WHERE company_id = ?
         ORDER BY participants_count DESC, id DESC
         LIMIT 6`,
        [companyId]
      ),

      // 8. Leads recentes
      pool.query<RowDataPacket[]>(
        `SELECT l.id, l.name, l.whatsapp, l.origin_slug, l.status, l.created_at, lp.title as landing_title
         FROM company_leads l
         LEFT JOIN company_group_landing_pages lp ON lp.id = l.landing_page_id
         WHERE l.company_id = ?
         ORDER BY l.id DESC
         LIMIT 6`,
        [companyId]
      ),

      // 9. Total participantes
      pool.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(participants_count), 0) as total_participants FROM company_whatsapp_groups WHERE company_id = ?`,
        [companyId]
      ),
    ]);

    const company = companies.length > 0 ? companies[0] : null;
    const hasActiveSubscription = company?.sub_status === "active";
    const subscriptionStatus = company?.sub_status || "none";

    const currentGroups = Number(company?.current_groups_count || 0);
    const currentProducts = Number(company?.current_products_count || 0);
    const currentViews = Number(company?.current_views_count || 0);
    const currentLeads = Number(company?.current_leads_count || 0);

    const limitGroups = Number(company?.sub_max_groups ?? company?.plan_max_groups ?? company?.max_groups ?? 0);
    const limitProducts = Number(company?.sub_max_products ?? company?.plan_max_products ?? company?.max_products ?? 0);
    const limitMessagesDay = Number(company?.sub_max_messages_day ?? company?.plan_max_messages_day ?? company?.max_messages_day ?? 0);
    const limitViews = Number(company?.sub_max_views ?? company?.plan_max_views ?? company?.max_views ?? 0);
    const limitLeads = Number(company?.sub_max_leads ?? company?.plan_max_leads ?? company?.max_leads ?? 0);

    const sendsToday = Number(jobsTodayRows[0]?.sends_today || 0);

    // Formata os dados dos últimos 7 dias para o gráfico
    const last7DaysChart: { date: string; label: string; sends: number; leads: number; views: number }[] = [];
    const dateMap = new Map<string, { sends: number; leads: number; views: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const displayDate = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      dateMap.set(dateStr, { sends: 0, leads: 0, views: 0 });
      last7DaysChart.push({ date: dateStr, label: displayDate, sends: 0, leads: 0, views: 0 });
    }

    dailyJobsRows.forEach((row) => {
      const rawDate = row.date_val;
      let dateKey = "";
      if (rawDate instanceof Date) {
        dateKey = rawDate.toISOString().split("T")[0];
      } else if (typeof rawDate === "string") {
        dateKey = rawDate.split("T")[0];
      }
      if (dateKey && dateMap.has(dateKey)) {
        dateMap.get(dateKey)!.sends = Number(row.sends_count || 0);
      }
    });

    dailyLeadsRows.forEach((row) => {
      const rawDate = row.date_val;
      let dateKey = "";
      if (rawDate instanceof Date) {
        dateKey = rawDate.toISOString().split("T")[0];
      } else if (typeof rawDate === "string") {
        dateKey = rawDate.split("T")[0];
      }
      if (dateKey && dateMap.has(dateKey)) {
        dateMap.get(dateKey)!.leads = Number(row.leads_count || 0);
      }
    });

    let chartIdx = 0;
    dateMap.forEach((val) => {
      if (last7DaysChart[chartIdx]) {
        last7DaysChart[chartIdx].sends = val.sends;
        last7DaysChart[chartIdx].leads = val.leads;
        last7DaysChart[chartIdx].views = val.views || 0;
      }
      chartIdx++;
    });

    const totalParticipants = Number(participantsSumRow[0]?.total_participants || 0);

    // 10. Métricas consolidadas
    const totalSent = instances.reduce((acc, curr) => acc + (Number(curr.total_messages_sent) || 0), 0);
    const totalReceived = instances.reduce((acc, curr) => acc + (Number(curr.total_messages_received) || 0), 0);
    const connectedCount = instances.filter((i) => i.status === "connected").length;

    const exceededItems: { key: string; label: string; current: number; max: number }[] = [];
    if (limitGroups > 0 && currentGroups >= limitGroups) {
      exceededItems.push({ key: "groups", label: "Grupos WhatsApp", current: currentGroups, max: limitGroups });
    }
    if (limitProducts > 0 && currentProducts >= limitProducts) {
      exceededItems.push({ key: "products", label: "Produtos no Catálogo", current: currentProducts, max: limitProducts });
    }
    if (limitViews > 0 && currentViews >= limitViews) {
      exceededItems.push({ key: "views", label: "Visualizações Mensais", current: currentViews, max: limitViews });
    }
    if (limitLeads > 0 && currentLeads >= limitLeads) {
      exceededItems.push({ key: "leads", label: "Leads Capturados", current: currentLeads, max: limitLeads });
    }

    return NextResponse.json({
      success: true,
      user,
      hasActiveSubscription,
      subscriptionStatus,
      limits: {
        exceeded: exceededItems.length > 0,
        exceededItems,
        plan_name: company?.current_plan_name || company?.plan || "Iniciante",
      },
      company: company
        ? {
            ...company,
            name: company.name || "Minha Empresa",
            plan: company.current_plan_name || company.plan || "Iniciante",
            subscription_end: company.sub_period_end || null,
            admin_whatsapp: company.admin_whatsapp || company.whatsapp || null,
            has_active_subscription: hasActiveSubscription,
            subscription_status: subscriptionStatus,
            onboarding_completed: Boolean(company.onboarding_completed),
            onboarding_current_step: company.onboarding_current_step || 1,
          }
        : {
            id: companyId,
            name: "Minha Empresa",
            plan: "Iniciante",
            status: "active",
            max_instances: 5,
            max_messages_day: 5000,
            subscription_end: null,
            admin_whatsapp: null,
            has_active_subscription: false,
            subscription_status: "none",
            onboarding_completed: false,
            onboarding_current_step: 1,
          },
      stats: {
        totalInstances: instances.length,
        connectedInstances: connectedCount,
        maxInstances: company?.max_instances || 5,
        maxMessagesDay: limitMessagesDay || company?.max_messages_day || 5000,
        totalMessagesSent: totalSent,
        totalMessagesReceived: totalReceived,
        totalParticipants,
        totalCampaigns: 0,
        activeGroups: currentGroups,
        teamMembersCount: users.length,
        sendsToday,
      },
      quotas: {
        groups: { current: currentGroups, limit: limitGroups },
        products: { current: currentProducts, limit: limitProducts },
        messages_day: { current: sendsToday, limit: limitMessagesDay, totalSent },
        views: { current: currentViews, limit: limitViews },
        leads: { current: currentLeads, limit: limitLeads },
      },
      last7DaysChart,
      topProducts,
      topGroups,
      recentLeads,
      instances,
      users,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao carregar dados do painel";
    console.error("Erro em /api/painel/dashboard:", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
