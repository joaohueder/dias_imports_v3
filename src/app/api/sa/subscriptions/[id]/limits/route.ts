import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("subscriptions", "edit");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();
    const { id } = await params;
    const body = await request.json();

    const { max_groups, max_products, max_messages_day, max_instances } = body;

    // Busca a assinatura
    const [subRows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM subscriptions WHERE id = ?",
      [id]
    );

    if (subRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Assinatura não encontrada." },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (max_groups !== undefined) {
      updates.push("plan_snapshot_max_groups = ?");
      values.push(parseInt(String(max_groups), 10) || 0);
    }

    if (max_products !== undefined) {
      updates.push("plan_snapshot_max_products = ?");
      values.push(parseInt(String(max_products), 10) || 0);
    }

    if (max_messages_day !== undefined) {
      updates.push("plan_snapshot_max_messages_day = ?");
      values.push(parseInt(String(max_messages_day), 10) || 0);
    }

    if (max_instances !== undefined) {
      updates.push("plan_snapshot_max_instances = ?");
      values.push(parseInt(String(max_instances), 10) || 1);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhum campo fornecido para atualização." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    updates.push("updated_at = ?");
    values.push(now);

    values.push(id);

    await pool.query<ResultSetHeader>(
      `UPDATE subscriptions SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: "Limites da assinatura atualizados com sucesso!",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao atualizar limites da assinatura";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
