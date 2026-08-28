import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCurrentCompanyUser, getCurrentSaUser, getEffectiveCompanyId } from "@/lib/session";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const companyId = await getEffectiveCompanyId(user, req.cookies);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não associada" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const landingId = searchParams.get("landing_id") || "";

    const pool = getDbPool();

    let query = `
      SELECT 
        l.id,
        l.name,
        l.whatsapp,
        l.origin_slug,
        l.ip_address,
        l.created_at,
        l.status,
        lp.title as landing_title
      FROM company_leads l
      LEFT JOIN company_group_landing_pages lp ON lp.id = l.landing_page_id
      WHERE l.company_id = ?
    `;

    const params: any[] = [companyId];

    if (search.trim()) {
      const cleanSearch = search.trim();
      const cleanPhone = cleanSearch.replace(/\D/g, "");
      if (cleanPhone) {
        query += ` AND (l.name LIKE ? OR l.whatsapp LIKE ?)`;
        params.push(`%${cleanSearch}%`, `%${cleanPhone}%`);
      } else {
        query += ` AND l.name LIKE ?`;
        params.push(`%${cleanSearch}%`);
      }
    }

    if (landingId && !isNaN(Number(landingId))) {
      query += ` AND l.landing_page_id = ?`;
      params.push(Number(landingId));
    }

    query += ` ORDER BY l.id DESC LIMIT 500`;

    const [leads] = await pool.query<RowDataPacket[]>(query, params);

    // 1. Limite da assinatura da empresa
    const [subRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COALESCE(
          (SELECT s.plan_snapshot_max_leads FROM subscriptions s WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1),
          (SELECT p.max_leads FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.company_id = c.id AND s.status = 'active' ORDER BY s.id DESC LIMIT 1),
          0
        ) as max_leads
       FROM companies c
       WHERE c.id = ?
       LIMIT 1`,
      [companyId]
    );
    const maxLeads = subRows.length > 0 ? Number(subRows[0].max_leads || 0) : 0;

    // 2. Métricas gerais de leads da empresa (Total, Únicos, Hoje, Ontem, etc.)
    const [statsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_leads,
        COUNT(DISTINCT whatsapp) as unique_leads,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_leads,
        SUM(CASE WHEN DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) as yesterday_leads,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_leads
       FROM company_leads
       WHERE company_id = ?`,
      [companyId]
    );

    const stats = statsRows[0] || {
      total_leads: 0,
      unique_leads: 0,
      today_leads: 0,
      yesterday_leads: 0,
      week_leads: 0,
    };

    // 3. Total de Views das Landing Pages da empresa
    const [viewsRows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(views_count), 0) as total_views FROM company_group_landing_pages WHERE company_id = ?`,
      [companyId]
    );
    const totalViews = viewsRows.length > 0 ? Number(viewsRows[0].total_views || 0) : 0;

    // 4. Histórico dos últimos 7 dias para evolução de leads por data
    const [dailyLeadsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        DATE(created_at) as date_val,
        COUNT(*) as leads_count
       FROM company_leads
       WHERE company_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date_val ASC`,
      [companyId]
    );

    // Monta os últimos 7 dias consecutivos
    const last7Days: { date: string; label: string; leads: number; views: number }[] = [];
    const dailyLeadsMap = new Map<string, number>();
    (dailyLeadsRows || []).forEach((row) => {
      const dStr = new Date(row.date_val).toISOString().slice(0, 10);
      dailyLeadsMap.set(dStr, Number(row.leads_count || 0));
    });

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      const dayMonth = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      const leadsCount = dailyLeadsMap.get(dStr) || 0;
      
      // Proporção aproximada de views baseada na taxa de conversão geral
      const convRatio = Number(stats.total_leads || 0) > 0 ? totalViews / Number(stats.total_leads || 1) : 3;
      const estimatedViews = Math.round(leadsCount * Math.max(1.5, Math.min(10, convRatio)));

      last7Days.push({
        date: dStr,
        label: `${dayName}, ${dayMonth}`,
        leads: leadsCount,
        views: estimatedViews,
      });
    }

    return NextResponse.json({
      success: true,
      leads,
      stats: {
        total_leads: Number(stats.total_leads || 0),
        max_leads: maxLeads,
        unique_leads: Number(stats.unique_leads || 0),
        today_leads: Number(stats.today_leads || 0),
        yesterday_leads: Number(stats.yesterday_leads || 0),
        week_leads: Number(stats.week_leads || 0),
        total_views: totalViews,
      },
      chart_data: last7Days,
    });
  } catch (error: any) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const companyUser = await getCurrentCompanyUser(req);
    const saUser = await getCurrentSaUser(req);

    const companyId = companyUser?.company_id || saUser?.company_id;
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ success: false, message: "ID do lead inválido" }, { status: 400 });
    }

    const pool = getDbPool();
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM company_leads WHERE id = ? AND company_id = ?`,
      [Number(id), companyId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Lead não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Lead excluído com sucesso" });
  } catch (error: any) {
    console.error("Erro ao excluir lead:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
