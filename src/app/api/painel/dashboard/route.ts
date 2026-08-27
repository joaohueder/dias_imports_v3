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

    const companyId = await getEffectiveCompanyId(user);
    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Empresa não vinculada." },
        { status: 403 }
      );
    }

    const pool = getDbPool();

    // 1. Dados da empresa (com plano da assinatura ativa se houver)
    const [companies] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, 
              COALESCE(
                (SELECT p.name FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1),
                c.plan,
                'Personalizado'
              ) as current_plan_name,
              (SELECT COUNT(*) FROM instances WHERE company_id = c.id) as total_instances,
              (SELECT COUNT(*) FROM instances WHERE company_id = c.id AND status = 'connected') as connected_instances
       FROM companies c 
       WHERE c.id = ? 
       LIMIT 1`,
      [companyId]
    );

    const company = companies.length > 0 ? companies[0] : null;

    // 2. Instâncias da empresa
    const [instances] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, whatsapp_number, status, phone_connected, profile_name, 
              profile_picture_url, battery_level, is_charging, is_default, 
              total_messages_sent, total_messages_received, last_activity_at, updated_at
       FROM instances 
       WHERE company_id = ?
       ORDER BY is_default DESC, id DESC`,
      [companyId]
    );

    // 3. Usuários da empresa
    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, email, whatsapp, role, status, created_at 
       FROM users 
       WHERE company_id = ?
       ORDER BY role ASC, name ASC`,
      [companyId]
    );

    // 4. Métricas consolidadas
    const totalSent = instances.reduce((acc, curr) => acc + (Number(curr.total_messages_sent) || 0), 0);
    const totalReceived = instances.reduce((acc, curr) => acc + (Number(curr.total_messages_received) || 0), 0);
    const connectedCount = instances.filter((i) => i.status === "connected").length;

    return NextResponse.json({
      success: true,
      user,
      company: company
        ? {
            ...company,
            plan: company.current_plan_name || company.plan || "Iniciante",
          }
        : {
            id: companyId,
            name: "Minha Empresa",
            plan: "Iniciante",
            status: "active",
            max_instances: 5,
            max_messages_day: 5000,
          },
      stats: {
        totalInstances: instances.length,
        connectedInstances: connectedCount,
        maxInstances: company?.max_instances || 5,
        maxMessagesDay: company?.max_messages_day || 5000,
        totalMessagesSent: totalSent,
        totalMessagesReceived: totalReceived,
        totalCampaigns: 0,
        activeGroups: 0,
        teamMembersCount: users.length,
      },
      instances,
      users,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao carregar dados do painel";
    console.error("Erro em /api/painel/dashboard:", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
