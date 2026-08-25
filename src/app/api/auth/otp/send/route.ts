import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "USER";
  company_id: number | null;
  status: "active" | "inactive";
  company_name?: string;
  company_status?: string;
}

// POST: Solicitar envio de OTP via WhatsApp
export async function POST(request: Request) {
  try {
    await initAuthDatabase();
    const pool = getDbPool();
    const body = await request.json();
    const { whatsapp } = body;

    if (!whatsapp) {
      return NextResponse.json(
        { success: false, message: "Número do WhatsApp é obrigatório." },
        { status: 400 }
      );
    }

    const cleanWhatsapp = String(whatsapp).replace(/\D/g, "");
    if (cleanWhatsapp.length < 10 || cleanWhatsapp.length > 13) {
      return NextResponse.json(
        { success: false, message: "Número de WhatsApp inválido." },
        { status: 400 }
      );
    }

    // Busca usuário pelo WhatsApp cadastrado (como usuário ou como admin_whatsapp na company)
    const [users] = await pool.query<UserRow[]>(
      `SELECT u.id, u.name, u.email, u.whatsapp, u.role, u.company_id, u.status,
              c.name as company_name, c.status as company_status, c.admin_whatsapp
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(u.whatsapp, ' ', ''), '-', ''), '(', ''), ')', '') = ?
          OR REPLACE(REPLACE(REPLACE(REPLACE(c.admin_whatsapp, ' ', ''), '-', ''), '(', ''), ')', '') = ?
       LIMIT 1`,
      [cleanWhatsapp, cleanWhatsapp]
    );

    if (users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Nenhuma conta vinculada a este número de WhatsApp. Verifique com o administrador.",
        },
        { status: 404 }
      );
    }

    const user = users[0];

    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Sua conta de usuário está desativada." },
        { status: 403 }
      );
    }

    if (user.company_status && user.company_status !== "active" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Acesso bloqueado: a empresa vinculada está inativa ou suspensa." },
        { status: 403 }
      );
    }

    // Gerar código OTP de 6 dígitos numéricos
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos de validade

    // Grava código no banco de dados para o usuário
    await pool.query<ResultSetHeader>(
      "UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?",
      [otpCode, expiresAt, user.id]
    );

    // Em produção integrará com o disparador WhatsApp; em dev/simulação logamos e retornamos código
    console.log(`[OTP WHATSAPP] Enviando código ${otpCode} para o número ${cleanWhatsapp} (Usuário: ${user.name})`);

    const isDevelopment = process.env.NODE_ENV !== "production";

    return NextResponse.json({
      success: true,
      message: "Código de verificação OTP enviado via WhatsApp com sucesso!",
      // Exibimos estritamente em ambiente de desenvolvimento local
      ...(isDevelopment ? { devOtpPreview: otpCode } : {}),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao processar solicitação de OTP";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
