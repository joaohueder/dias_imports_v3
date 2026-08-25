import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSaPermission("dashboard", "view");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();

    // 1. Total de Empresas e Status
    const [companiesRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_companies,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_companies,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_companies
      FROM companies
    `);
    const totalCompanies = Number(companiesRows[0]?.total_companies || 0);
    const activeCompanies = Number(companiesRows[0]?.active_companies || 0);
    const inactiveCompanies = Number(companiesRows[0]?.inactive_companies || 0);

    // 2. Total de Planos e Status
    const [plansRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_plans,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_plans
      FROM plans
    `);
    const totalPlans = Number(plansRows[0]?.total_plans || 0);
    const activePlans = Number(plansRows[0]?.active_plans || 0);

    // 3. Assinaturas por status e MRR estimado
    const [subsRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_subscriptions,
        SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as active_subscriptions,
        SUM(CASE WHEN s.status = 'past_due' THEN 1 ELSE 0 END) as past_due_subscriptions,
        SUM(CASE WHEN s.status = 'canceled' THEN 1 ELSE 0 END) as canceled_subscriptions,
        SUM(CASE WHEN s.status = 'expired' THEN 1 ELSE 0 END) as expired_subscriptions,
        SUM(CASE 
          WHEN s.status = 'active' AND p.billing_cycle = 'monthly' THEN p.price 
          WHEN s.status = 'active' AND p.billing_cycle = 'quarterly' THEN (p.price / 3)
          WHEN s.status = 'active' AND p.billing_cycle = 'semiannual' THEN (p.price / 6)
          WHEN s.status = 'active' AND p.billing_cycle = 'yearly' THEN (p.price / 12)
          ELSE 0 
        END) as estimated_mrr
      FROM subscriptions s
      LEFT JOIN plans p ON s.plan_id = p.id
    `);

    const totalSubs = Number(subsRows[0]?.total_subscriptions || 0);
    const activeSubs = Number(subsRows[0]?.active_subscriptions || 0);
    const pastDueSubs = Number(subsRows[0]?.past_due_subscriptions || 0);
    const canceledSubs = Number(subsRows[0]?.canceled_subscriptions || 0);
    const expiredSubs = Number(subsRows[0]?.expired_subscriptions || 0);
    const estimatedMrr = Number(subsRows[0]?.estimated_mrr || 0);

    // 4. Últimas empresas cadastradas com seu plano mais recente/ativo
    const [recentCompanies] = await pool.query<RowDataPacket[]>(`
      SELECT 
        c.id,
        c.name,
        c.document,
        c.email,
        c.admin_whatsapp,
        c.status,
        c.created_at,
        p.name as plan_name,
        latest_sub.status as subscription_status,
        latest_sub.current_period_end
      FROM companies c
      LEFT JOIN (
        SELECT s1.*
        FROM subscriptions s1
        INNER JOIN (
          SELECT company_id, MAX(id) as max_id
          FROM subscriptions
          GROUP BY company_id
        ) s2 ON s1.company_id = s2.company_id AND s1.id = s2.max_id
      ) latest_sub ON latest_sub.company_id = c.id
      LEFT JOIN plans p ON latest_sub.plan_id = p.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    // 5. Distribuição de assinaturas por plano
    const [plansDistribution] = await pool.query<RowDataPacket[]>(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.billing_cycle,
        p.sort_order,
        COUNT(s.id) as total_subscriptions,
        SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as active_subscriptions
      FROM plans p
      LEFT JOIN subscriptions s ON s.plan_id = p.id
      GROUP BY p.id, p.name, p.price, p.billing_cycle, p.sort_order
      ORDER BY active_subscriptions DESC, p.sort_order ASC
    `);

    return NextResponse.json({
      success: true,
      stats: {
        companies: {
          total: totalCompanies,
          active: activeCompanies,
          inactive: inactiveCompanies,
        },
        plans: {
          total: totalPlans,
          active: activePlans,
        },
        subscriptions: {
          total: totalSubs,
          active: activeSubs,
          past_due: pastDueSubs,
          canceled: canceledSubs,
          expired: expiredSubs,
          mrr: estimatedMrr,
        },
      },
      recentCompanies,
      plansDistribution,
    });
  } catch (error: unknown) {
    console.error("[Dashboard API Error]:", error);
    const msg = error instanceof Error ? error.message : "Erro ao carregar estatísticas do dashboard";
    return NextResponse.json({ success: false, error: msg, details: String(error) }, { status: 500 });
  }
}
