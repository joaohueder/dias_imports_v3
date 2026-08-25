import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  otp_code: string | null;
  otp_expires_at: Date | string | null;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "USER";
  company_id: number | null;
  status: "active" | "inactive";
  company_name?: string;
  company_status?: string;
}

// POST: Validar código OTP e autenticar usuário
export async function POST(request: Request) {
  try {
    await initAuthDatabase();
    const pool = getDbPool();
    const body = await request.json();
    const { whatsapp, code, portalType = "painel" } = body;

    if (!whatsapp || !code) {
      return NextResponse.json(
        { success: false, message: "WhatsApp e código OTP são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanWhatsapp = String(whatsapp).replace(/\D/g, "");
    const cleanCode = String(code).trim();

    const [users] = await pool.query<UserRow[]>(
      `SELECT u.id, u.name, u.email, u.whatsapp, u.otp_code, u.otp_expires_at, u.role, u.company_id, u.status,
              c.name as company_name, c.status as company_status
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(u.whatsapp, ' ', ''), '-', ''), '(', ''), ')', '') = ?
          OR REPLACE(REPLACE(REPLACE(REPLACE(c.admin_whatsapp, ' ', ''), '-', ''), '(', ''), ')', '') = ?
       LIMIT 1`,
      [cleanWhatsapp, cleanWhatsapp]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    const user = users[0];

    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Sua conta está inativa. Contate o suporte." },
        { status: 403 }
      );
    }

    if (!user.otp_code || user.otp_code !== cleanCode) {
      return NextResponse.json(
        { success: false, message: "Código de verificação incorreto ou expirado." },
        { status: 401 }
      );
    }

    // Checar expiração do código
    if (user.otp_expires_at) {
      const expiresAt = new Date(user.otp_expires_at);
      if (expiresAt.getTime() < Date.now()) {
        return NextResponse.json(
          { success: false, message: "O código OTP expirou. Solicite um novo código." },
          { status: 401 }
        );
      }
    }

    // Invalida o código OTP após uso com sucesso
    await pool.query<ResultSetHeader>(
      "UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?",
      [user.id]
    );

    const redirectTo = user.role === "SUPER_ADMIN" ? "/sa" : "/painel";

    return NextResponse.json({
      success: true,
      message: "Autenticação realizada com sucesso!",
      redirectTo,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        whatsapp: user.whatsapp,
        role: user.role,
        company_id: user.company_id,
        company_name: user.company_name,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao validar código OTP";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
