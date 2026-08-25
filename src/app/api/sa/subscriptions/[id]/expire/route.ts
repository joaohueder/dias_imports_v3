import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("subscriptions", "edit");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();
    const { id } = await params;
    const subscriptionId = Number(id);

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: "ID da assinatura inválido." },
        { status: 400 }
      );
    }

    // Verifica se a assinatura existe
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM subscriptions WHERE id = ?",
      [subscriptionId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Assinatura não encontrada." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Atualiza o status para expired e ajusta current_period_end para agora
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE subscriptions 
       SET status = 'expired', 
           current_period_end = ?,
           updated_at = ?
       WHERE id = ?`,
      [now, now, subscriptionId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Não foi possível atualizar a assinatura." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Assinatura expirada com sucesso.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao expirar assinatura";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
