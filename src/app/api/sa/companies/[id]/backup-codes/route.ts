import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireSaPermission } from "@/lib/server-permissions";
import { generateBackupCodes } from "@/lib/backup-codes";
import { logAudit, getClientIpAndAgent } from "@/lib/audit";

export const dynamic = "force-dynamic";

// POST - Regenerar códigos reserva para uma empresa
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSaPermission("companies", "edit");
    if (!auth.authorized) return auth.response;

    await initAuthDatabase();
    const { id } = await params;
    const pool = getDbPool();

    const [companies] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, backup_codes FROM companies WHERE id = ?",
      [id]
    );

    if (companies.length === 0) {
      return NextResponse.json(
        { success: false, error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    const newBackupCodes = generateBackupCodes(10);
    const jsonStr = JSON.stringify(newBackupCodes);

    await pool.query<ResultSetHeader>(
      "UPDATE companies SET backup_codes = ? WHERE id = ?",
      [jsonStr, id]
    );

    const { ip, userAgent } = getClientIpAndAgent(request);
    await logAudit({
      userId: auth.user.id,
      userName: auth.user.name,
      userEmail: auth.user.email,
      userRole: auth.user.role,
      action: "COMPANY_REGENERATE_BACKUP_CODES",
      entityType: "companies",
      entityId: id,
      ipAddress: ip,
      userAgent,
      newValues: { count: newBackupCodes.length },
    });

    return NextResponse.json({
      success: true,
      backup_codes: newBackupCodes,
      message: "10 novos códigos reserva foram gerados com sucesso!",
    });
  } catch (error: unknown) {
    console.error("Erro ao regenerar códigos reserva:", error);
    const message = error instanceof Error ? error.message : "Erro ao regenerar códigos reserva";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
