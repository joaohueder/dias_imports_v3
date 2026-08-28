import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("plans", "view");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();
    const { id } = await params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.*,
        (SELECT COUNT(*) FROM subscriptions s WHERE s.plan_id = p.id AND s.status = 'active') as active_subscriptions_count
       FROM plans p WHERE p.id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Plano não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: rows[0],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao buscar plano";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("plans", "edit");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();
    const { id } = await params;
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

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE plans SET 
        name = ?,
        description = ?,
        price = ?,
        billing_cycle = ?,
        status = ?,
        max_groups = ?,
        max_products = ?,
        max_messages_day = ?,
        max_views = ?,
        max_leads = ?,
        max_instances = ?,
        is_featured = ?
       WHERE id = ?`,
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
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Plano não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Plano atualizado com sucesso.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao atualizar plano";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("plans", "delete");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();
    const { id } = await params;

    // Verificar se existem assinaturas ativas vinculadas a este plano
    const [subs] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = ?",
      [id]
    );

    if (subs[0]?.count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Não é possível excluir este plano pois existem assinaturas vinculadas a ele. Você pode inativá-lo.",
        },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM plans WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Plano não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Plano removido com sucesso.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao excluir plano";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
