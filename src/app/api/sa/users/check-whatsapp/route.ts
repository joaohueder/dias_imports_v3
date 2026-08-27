import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";

// GET: Verifica se um número de WhatsApp já está cadastrado para outro usuário
// Query params: ?whatsapp=11999999999&excludeUserId=123 (opcional para telas de edição)
export async function GET(request: Request) {
  try {
    const auth = await requireSaPermission("users", "view");
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const whatsapp = searchParams.get("whatsapp");
    const excludeUserId = searchParams.get("excludeUserId");

    const cleanWhatsapp = (whatsapp || "").replace(/\D/g, "");

    if (!cleanWhatsapp) {
      return NextResponse.json({
        success: true,
        exists: false,
        available: true,
        message: "Nenhum WhatsApp informado.",
      });
    }

    if (cleanWhatsapp.length < 10 || cleanWhatsapp.length > 11) {
      return NextResponse.json({
        success: true,
        exists: false,
        available: false,
        invalidFormat: true,
        message: "O WhatsApp deve conter DDD + 8 ou 9 dígitos.",
      });
    }

    await initAuthDatabase();
    const pool = getDbPool();

    let query = `
      SELECT id, name, email, role, status 
      FROM users 
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(whatsapp, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = ?
    `;
    const params: (string | number)[] = [cleanWhatsapp];

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
      available: !exists,
      user: exists
        ? {
            id: rows[0].id,
            name: rows[0].name,
            email: rows[0].email,
            role: rows[0].role,
            status: rows[0].status,
          }
        : null,
      message: exists
        ? `Este WhatsApp já está cadastrado para o usuário "${rows[0].name}" (${rows[0].email}).`
        : "WhatsApp disponível para cadastro.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { success: false, message, exists: false, available: false },
      { status: 500 }
    );
  }
}
