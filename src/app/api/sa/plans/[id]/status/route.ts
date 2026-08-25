import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";

export async function PATCH(
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

    const { status } = body;

    if (!status || !["active", "inactive"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status inválido. Use 'active' ou 'inactive'." },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE plans SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Plano não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status,
      message: `Plano ${status === "active" ? "ativado" : "inativado"} com sucesso.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao alterar status do plano";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
