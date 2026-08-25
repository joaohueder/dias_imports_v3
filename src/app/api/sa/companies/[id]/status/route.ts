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
    const auth = await requireSaPermission("companies", "edit");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json();

    const { status } = body;

    if (!status || !["active", "inactive", "suspended"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status inválido. Deve ser 'active', 'inactive' ou 'suspended'." },
        { status: 400 }
      );
    }

    // Verifica se a empresa existe
    const [compRows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, status FROM companies WHERE id = ?",
      [id]
    );

    if (compRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Empresa não encontrada." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.query<ResultSetHeader>(
      "UPDATE companies SET status = ?, updated_at = ? WHERE id = ?",
      [status, now, id]
    );

    return NextResponse.json({
      success: true,
      message: "Status da empresa atualizado com sucesso!",
    });
  } catch (error: unknown) {
    console.error("Erro na rota /api/sa/companies/[id]/status:", error);
    const message = error instanceof Error ? error.message : "Erro ao alterar status da empresa";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
