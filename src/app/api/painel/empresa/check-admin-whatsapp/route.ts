import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET - Verifica se o WhatsApp de Acesso Admin já está em uso por outra empresa
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const impersonateCompanyId = cookieStore.get("company_id")?.value;

    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json({ available: false, message: "Não autorizado." }, { status: 401 });
    }

    const currentCompanyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : 1);
    const pool = getDbPool();

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone") || "";

    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({
        available: true,
        message: "Número incompleto",
      });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, trade_name 
       FROM companies 
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(admin_whatsapp, ' ', ''), '-', ''), '(', ''), ')', '') = ?
         AND id != ?
       LIMIT 1`,
      [cleanPhone, currentCompanyId]
    );

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
    console.error("Erro na rota /api/painel/empresa/check-admin-whatsapp:", error);
    const message = error instanceof Error ? error.message : "Erro ao checar WhatsApp";
    return NextResponse.json({ available: false, error: message }, { status: 500 });
  }
}
