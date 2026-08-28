import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser, getEffectiveCompanyId } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET - Listar planos disponíveis para upgrade e histórico de assinaturas da empresa
export async function GET() {
  try {
    const cookieStore = await cookies();

    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado." }, { status: 401 });
    }

    const companyId = await getEffectiveCompanyId(user, cookieStore);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não associada." }, { status: 403 });
    }
    const pool = getDbPool();

    // 1. Planos ativos no catálogo
    const [plans] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, description, price, billing_cycle, status, 
              max_groups, max_products, max_messages_day, max_views, max_leads, max_instances, 
              is_featured, features
       FROM plans
       WHERE status = 'active'
       ORDER BY sort_order ASC, price ASC, id ASC`
    );

    // 2. Histórico de assinaturas da empresa
    const [subscriptions] = await pool.query<RowDataPacket[]>(
      `SELECT s.*, 
              p.name as plan_name,
              p.description as plan_description
       FROM subscriptions s
       LEFT JOIN plans p ON p.id = s.plan_id
       WHERE s.company_id = ?
       ORDER BY s.id DESC`,
      [companyId]
    );

    // 3. Assinatura ativa atual
    const activeSubscription = subscriptions.find((sub) => sub.status === "active") || null;

    return NextResponse.json({
      success: true,
      plans,
      subscriptions,
      activeSubscription,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao carregar dados de assinatura." },
      { status: 500 }
    );
  }
}
