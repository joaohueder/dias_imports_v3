import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { logAudit, getClientIpAndAgent } from "@/lib/audit";
import { signSessionToken } from "@/lib/session";
import { normalizeBackupCode, BackupCodeItem } from "@/lib/backup-codes";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface CompanyRow extends RowDataPacket {
  id: number;
  name: string;
  trade_name?: string | null;
  admin_whatsapp: string;
  backup_codes: string | BackupCodeItem[] | null;
  status: "active" | "inactive" | "suspended";
}

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "USER";
  company_id: number;
  status: "active" | "inactive";
}

// POST: Validar código de reserva da empresa e autenticar
export async function POST(request: Request) {
  try {
    await initAuthDatabase();
    const pool = getDbPool();
    const body = await request.json();
    const { whatsapp, code } = body;

    if (!whatsapp || !code) {
      return NextResponse.json(
        { success: false, message: "WhatsApp e código reserva são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanWhatsapp = String(whatsapp).replace(/\D/g, "");
    const formattedCode = normalizeBackupCode(String(code));
    const { ip, userAgent } = getClientIpAndAgent(request);

    // Rate Limiting para evitar brute-force nos códigos reservas (5 tentativas a cada 1 minuto por IP)
    const rl = checkRateLimit(`backup_code_${ip}_${cleanWhatsapp}`, 5, 60 * 1000);
    if (!rl.allowed) {
      await logAudit({
        action: "AUTH_BACKUP_CODE_RATE_LIMITED",
        entityType: "auth",
        ipAddress: ip,
        userAgent,
        status: "failed",
        newValues: { whatsapp: cleanWhatsapp, retryAfterSeconds: rl.retryAfterSeconds },
      });

      return NextResponse.json(
        {
          success: false,
          message: `Muitas tentativas com código de reserva. Aguarde ${rl.retryAfterSeconds} segundos.`,
        },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    // Busca empresa pelo admin_whatsapp ou pelo whatsapp do usuário
    const [companies] = await pool.query<CompanyRow[]>(
      `SELECT c.id, c.name, c.trade_name, c.admin_whatsapp, c.backup_codes, c.status
       FROM companies c
       LEFT JOIN users u ON u.company_id = c.id
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(c.admin_whatsapp, ''), ' ', ''), '-', ''), '(', ''), ')', '') = ?
          OR REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(u.whatsapp, ''), ' ', ''), '-', ''), '(', ''), ')', '') = ?
       LIMIT 1`,
      [cleanWhatsapp, cleanWhatsapp]
    );

    if (companies.length === 0) {
      await logAudit({
        action: "AUTH_BACKUP_CODE_FAILED",
        entityType: "auth",
        ipAddress: ip,
        userAgent,
        status: "failed",
        newValues: { whatsapp: cleanWhatsapp, reason: "Empresa não encontrada" },
      });

      return NextResponse.json(
        { success: false, message: "Nenhuma empresa vinculada a este número de WhatsApp." },
        { status: 404 }
      );
    }

    const company = companies[0];

    if (company.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Acesso bloqueado: a empresa está inativa ou suspensa." },
        { status: 403 }
      );
    }

    let backupCodes: BackupCodeItem[] = [];
    if (company.backup_codes) {
      try {
        backupCodes = typeof company.backup_codes === "string"
          ? JSON.parse(company.backup_codes)
          : company.backup_codes;
      } catch {}
    }

    if (!Array.isArray(backupCodes) || backupCodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A empresa não possui códigos reserva gerados. Solicite ao suporte ou aguarde a conexão do WhatsApp.",
        },
        { status: 400 }
      );
    }

    // Procura o código informado (compara tanto formatado com hífen quanto sem hífen)
    const cleanInput = formattedCode.replace(/[^A-Z0-9]/g, "");
    const codeIndex = backupCodes.findIndex((item) => {
      const itemClean = (item.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      return itemClean === cleanInput;
    });

    if (codeIndex === -1) {
      await logAudit({
        companyId: company.id,
        action: "AUTH_BACKUP_CODE_FAILED",
        entityType: "auth",
        ipAddress: ip,
        userAgent,
        status: "failed",
        newValues: { reason: "Código reserva incorreto", code: formattedCode },
      });

      return NextResponse.json(
        { success: false, message: "Código reserva inválido." },
        { status: 401 }
      );
    }

    // Registra o uso do código sem bloqueá-lo para acessos futuros
    const nowIso = new Date().toISOString();
    backupCodes[codeIndex].usage_count = (backupCodes[codeIndex].usage_count || 0) + 1;
    backupCodes[codeIndex].last_used_at = nowIso;
    backupCodes[codeIndex].used = true;
    backupCodes[codeIndex].used_at = nowIso;

    await pool.query<ResultSetHeader>(
      "UPDATE companies SET backup_codes = ? WHERE id = ?",
      [JSON.stringify(backupCodes), company.id]
    );

    // Busca usuário COMPANY_ADMIN para emitir a sessão
    const [users] = await pool.query<UserRow[]>(
      `SELECT id, name, email, whatsapp, role, company_id, status 
       FROM users 
       WHERE company_id = ? 
       ORDER BY (role = 'COMPANY_ADMIN') DESC, id ASC 
       LIMIT 1`,
      [company.id]
    );

    let user: UserRow;
    if (users.length > 0) {
      user = users[0];
    } else {
      // Cria usuário sob demanda se ainda não existir
      const generatedEmail = `admin_${company.id}_${Date.now()}@empresa.com`;
      const [insertRes] = await pool.query<ResultSetHeader>(
        `INSERT INTO users (name, email, whatsapp, password, role, company_id, status)
         VALUES (?, ?, ?, '123456', 'COMPANY_ADMIN', ?, 'active')`,
        [company.trade_name || company.name, generatedEmail, company.admin_whatsapp || null, company.id]
      );
      user = {
        id: insertRes.insertId,
        name: company.trade_name || company.name,
        email: generatedEmail,
        whatsapp: company.admin_whatsapp,
        role: "COMPANY_ADMIN",
        company_id: company.id,
        status: "active",
      } as UserRow;
    }

    // Cria token e cookies de sessão padronizados
    const authToken = signSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const isProduction = process.env.NODE_ENV === "production";

    const remainingCodes = backupCodes.filter((c) => !c.used).length;

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      companyId: user.company_id,
      action: "AUTH_BACKUP_CODE_SUCCESS",
      entityType: "auth",
      entityId: user.id,
      ipAddress: ip,
      userAgent,
      status: "success",
      newValues: {
        codeUsed: formattedCode,
        remainingCodes,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: `Autenticado com sucesso via código reserva!`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
      },
      redirectTo: "/painel",
    });

    // Define cookies de sessão padronizados consumidos pelo middleware e session.ts
    response.cookies.set("company_auth_token", authToken, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    });
    response.cookies.set("company_user_id", String(user.id), {
      path: "/",
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
    });
    response.cookies.set("company_id", String(user.company_id || ""), {
      path: "/",
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    console.error("[AUTH_BACKUP_CODE_VERIFY_ERROR]:", error);
    const message = error instanceof Error ? error.message : "Erro ao autenticar com código reserva";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
