import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireSaPermission("plans", "view");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const visibility = searchParams.get("visibility") || "all";

    let query = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM subscriptions s WHERE s.plan_id = p.id) as subscriptions_count,
        (SELECT COUNT(*) FROM subscriptions s WHERE s.plan_id = p.id AND s.status = 'active') as active_subscriptions_count
      FROM plans p
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (search) {
      query += " AND (p.name LIKE ? OR p.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status !== "all") {
      query += " AND p.status = ?";
      params.push(status);
    }

    if (visibility === "public") {
      query += " AND (p.is_public = 1 OR p.is_public IS NULL)";
    } else if (visibility === "private") {
      query += " AND p.is_public = 0";
    }

    query += " ORDER BY p.sort_order ASC, p.id ASC";

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      plans: rows,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao listar planos";
    console.error("Erro na rota GET /api/sa/plans:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSaPermission("plans", "create");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();
    const body = await request.json();

    const {
      name,
      description,
      price,
      billing_cycle,
      status,
      max_groups,
      max_products,
      max_messages_day,
      max_views,
      max_leads,
      max_instances,
      is_featured,
      is_public,
    } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "O nome do plano é obrigatório." },
        { status: 400 }
      );
    }

    const planPrice = parseFloat(price) || 0;
    const planMaxGroups = parseInt(max_groups, 10) || 0;
    const planMaxProducts = parseInt(max_products, 10) || 0;
    const planMaxMessages = parseInt(max_messages_day, 10) || 0;
    const planMaxViews = parseInt(max_views, 10) || 0;
    const planMaxLeads = parseInt(max_leads, 10) || 0;
    const planMaxInstances = parseInt(max_instances, 10) || 1;
    const planStatus = status === "inactive" ? "inactive" : "active";
    const planCycle = billing_cycle || "monthly";
    const planFeatured = !!is_featured;
    const planPublic = is_public !== undefined ? !!is_public : true;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO plans (
        name, description, price, billing_cycle, status,
        max_groups, max_products, max_messages_day, max_views, max_leads, max_instances, is_featured, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        description?.trim() || null,
        planPrice,
        planCycle,
        planStatus,
        planMaxGroups,
        planMaxProducts,
        planMaxMessages,
        planMaxViews,
        planMaxLeads,
        planMaxInstances,
        planFeatured,
        planPublic,
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: "Plano criado com sucesso.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao criar plano";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
