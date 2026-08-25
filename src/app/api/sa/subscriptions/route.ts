import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireSaPermission("subscriptions", "view");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id");
    const status = searchParams.get("status") || "all";

    let query = `
      SELECT 
        s.*,
        c.name as company_name,
        c.trade_name as company_trade_name,
        c.document as company_document,
        COALESCE(s.plan_snapshot_name, p.name) as plan_name,
        COALESCE(s.plan_snapshot_max_groups, p.max_groups) as max_groups,
        COALESCE(s.plan_snapshot_max_products, p.max_products) as max_products,
        COALESCE(s.plan_snapshot_max_messages_day, p.max_messages_day) as max_messages_day,
        COALESCE(s.plan_snapshot_max_instances, p.max_instances) as max_instances,
        COALESCE(s.plan_snapshot_billing_cycle, p.billing_cycle) as billing_cycle
      FROM subscriptions s
      JOIN companies c ON s.company_id = c.id
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (companyId) {
      query += " AND s.company_id = ?";
      params.push(companyId);
    }

    if (status !== "all") {
      query += " AND s.status = ?";
      params.push(status);
    }

    query += " ORDER BY s.created_at DESC";

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      subscriptions: rows,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao listar assinaturas";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSaPermission("subscriptions", "create");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();
    const body = await request.json();

    const {
      company_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      payment_method,
      price_at_subscription,
    } = body;

    if (!company_id || !plan_id) {
      return NextResponse.json(
        { success: false, error: "Empresa e Plano são obrigatórios." },
        { status: 400 }
      );
    }

    // Busca dados do plano para gerar o snapshot imutável
    const [planRows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM plans WHERE id = ?",
      [plan_id]
    );

    if (planRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Plano selecionado não encontrado." },
        { status: 404 }
      );
    }

    const plan = planRows[0];
    const snapshotPrice = price_at_subscription !== undefined && price_at_subscription !== ""
      ? parseFloat(price_at_subscription)
      : parseFloat(plan.price);

    const startDate = current_period_start || new Date().toISOString().slice(0, 19).replace("T", " ");
    const endDate = current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Cancela/encerra qualquer assinatura ativa anterior desta empresa
      await connection.query(
        `UPDATE subscriptions 
         SET status = 'canceled', 
             current_period_end = ?, 
             updated_at = ? 
         WHERE company_id = ? AND status = 'active'`,
        [now, now, company_id]
      );

      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO subscriptions (
          company_id, plan_id,
          plan_snapshot_name, plan_snapshot_max_groups, plan_snapshot_max_products,
          plan_snapshot_max_messages_day, plan_snapshot_max_instances,
          plan_snapshot_billing_cycle, plan_snapshot_features,
          status, current_period_start, current_period_end,
          payment_method, price_at_subscription
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          company_id,
          plan_id,
          plan.name,
          plan.max_groups,
          plan.max_products,
          plan.max_messages_day,
          plan.max_instances || 1,
          plan.billing_cycle || "monthly",
          plan.features ? JSON.stringify(plan.features) : null,
          status || "active",
          startDate,
          endDate,
          payment_method || "pix",
          snapshotPrice,
        ]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        id: result.insertId,
        message: "Plano contratado e assinatura anterior cancelada com sucesso.",
      });
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao criar assinatura";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
