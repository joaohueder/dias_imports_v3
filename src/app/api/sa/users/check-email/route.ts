import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

// GET: Verifica se um e-mail já está cadastrado no sistema
// Query params: ?email=exemplo@email.com&excludeUserId=123 (opcional para telas de edição)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const excludeUserId = searchParams.get("excludeUserId");

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "E-mail não fornecido.", exists: false },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validação básica de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: true, exists: false, invalidFormat: true },
        { status: 200 }
      );
    }

    await initAuthDatabase();
    const pool = getDbPool();

    let query = "SELECT id, name, role, status FROM users WHERE LOWER(email) = ?";
    const params: (string | number)[] = [cleanEmail];

    if (excludeUserId && !isNaN(Number(excludeUserId))) {
      query += " AND id != ?";
      params.push(Number(excludeUserId));
    }

    query += " LIMIT 1";

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    const exists = rows.length > 0;

    return NextResponse.json({
      success: true,
      exists,
      user: exists
        ? {
            id: rows[0].id,
            name: rows[0].name,
            role: rows[0].role,
            status: rows[0].status,
          }
        : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { success: false, message, exists: false },
      { status: 500 }
    );
  }
}
