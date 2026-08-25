import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";

// GET - Verifica se o WhatsApp de Acesso Admin já está em uso por outra empresa
export async function GET(request: Request) {
  try {
    const auth = await requireSaPermission("companies", "view");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const pool = getDbPool();

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone") || "";
    const excludeId = searchParams.get("exclude_id") || "";

    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({
        available: true,
        message: "Número incompleto",
      });
    }

    let query = `
      SELECT id, name, trade_name 
      FROM companies 
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(admin_whatsapp, ' ', ''), '-', ''), '(', ''), ')', '') = ?
    `;
    const params: (string | number)[] = [cleanPhone];

    if (excludeId && excludeId !== "new") {
      query += ` AND id != ?`;
      params.push(Number(excludeId));
    }

    query += ` LIMIT 1`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    if (rows.length > 0) {
      const company = rows[0];
      return NextResponse.json({
        available: false,
        conflictCompany: company.trade_name || company.name,
        message: `Este WhatsApp já está vinculado à empresa "${company.trade_name || company.name}".`,
      });
    }

    return NextResponse.json({
      available: true,
      message: "WhatsApp disponível para cadastro.",
    });
  } catch (error: unknown) {
    console.error("Erro na rota /api/sa/companies/check-admin-whatsapp:", error);
    const message = error instanceof Error ? error.message : "Erro ao checar WhatsApp";
    return NextResponse.json({ available: false, error: message }, { status: 500 });
  }
}
