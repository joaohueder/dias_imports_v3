import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
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
        p.name as plan_name,
        p.max_groups,
        p.max_products,
        p.max_messages_day,
        p.max_instances
      FROM subscriptions s
      JOIN companies c ON s.company_id = c.id
      JOIN plans p ON s.plan_id = p.id
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

    const startDate = current_period_start || new Date().toISOString().slice(0, 19).replace("T", " ");
    const endDate = current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO subscriptions (
        company_id, plan_id, status, current_period_start, current_period_end,
        payment_method, price_at_subscription
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        company_id,
        plan_id,
        status || "active",
        startDate,
        endDate,
        payment_method || "pix",
        parseFloat(price_at_subscription) || 0,
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: "Assinatura criada com sucesso.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao criar assinatura";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
