import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    await initAuthDatabase();
    const pool = getDbPool();
    const body = await request.json();

    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Lista de IDs ordenada não fornecida." },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (let i = 0; i < orderedIds.length; i++) {
        const id = Number(orderedIds[i]);
        if (!isNaN(id)) {
          await connection.query(
            "UPDATE plans SET sort_order = ? WHERE id = ?",
            [i + 1, id]
          );
        }
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return NextResponse.json({
      success: true,
      message: "Ordem dos planos atualizada com sucesso.",
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Erro ao atualizar ordenação";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
