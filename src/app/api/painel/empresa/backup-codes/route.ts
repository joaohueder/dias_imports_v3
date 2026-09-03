import { NextResponse } from "next/server";
import { getCurrentCompanyUser, getCurrentSaUser } from "@/lib/session";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { generateBackupCodes } from "@/lib/backup-codes";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET - Listar status dos códigos reserva da empresa
export async function GET() {
  try {
    await initAuthDatabase();
    const cookieStore = await cookies();
    const impersonateCompanyId = cookieStore.get("company_id")?.value;

    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado." }, { status: 401 });
    }

    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : null);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não identificada." }, { status: 400 });
    }

    const pool = getDbPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, backup_codes FROM companies WHERE id = ? LIMIT 1",
      [companyId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Empresa não encontrada." }, { status: 404 });
    }

    let backupCodes = [];
    if (rows[0].backup_codes) {
      try {
        backupCodes = typeof rows[0].backup_codes === "string" 
          ? JSON.parse(rows[0].backup_codes) 
          : rows[0].backup_codes;
      } catch {}
    }

    // Se a empresa ainda não tem códigos, gerar agora automaticamente
    if (!Array.isArray(backupCodes) || backupCodes.length === 0) {
      backupCodes = generateBackupCodes(10);
      await pool.query(
        "UPDATE companies SET backup_codes = ? WHERE id = ?",
        [JSON.stringify(backupCodes), companyId]
      );
    }

    return NextResponse.json({
      success: true,
      backup_codes: backupCodes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao buscar códigos reserva." },
      { status: 500 }
    );
  }
}

// POST - Regenerar códigos reserva da empresa (pelo próprio painel da empresa)
export async function POST() {
  try {
    await initAuthDatabase();
    const cookieStore = await cookies();
    const impersonateCompanyId = cookieStore.get("company_id")?.value;

    let user = await getCurrentCompanyUser();
    if (!user) {
      user = await getCurrentSaUser();
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado." }, { status: 401 });
    }

    const companyId = user.company_id || (impersonateCompanyId ? parseInt(impersonateCompanyId, 10) : null);
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Empresa não identificada." }, { status: 400 });
    }

    const pool = getDbPool();
    const newCodes = generateBackupCodes(10);

    await pool.query<ResultSetHeader>(
      "UPDATE companies SET backup_codes = ? WHERE id = ?",
      [JSON.stringify(newCodes), companyId]
    );

    return NextResponse.json({
      success: true,
      backup_codes: newCodes,
      message: "Novos códigos reserva gerados com sucesso!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao regenerar códigos reserva." },
      { status: 500 }
    );
  }
}
