import { NextResponse } from "next/server";
import { getDbPool, initAuthDatabase } from "@/lib/db";
import { signSessionToken } from "@/lib/session";
import { verifyPassword, hashPassword, isLegacyPlainPassword } from "@/lib/passwords";
import { RowDataPacket } from "mysql2";
import { logAudit, getClientIpAndAgent } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "ADMIN" | "COMPANY_ADMIN" | "USER";
  company_id: number | null;
  status: "active" | "inactive";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, portalType } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const { ip, userAgent } = getClientIpAndAgent(request);

    // Rate limiting: máximo de 10 tentativas por minuto por IP/Login
    const rl = checkRateLimit(`login_${ip}_${cleanEmail}`, 10, 60 * 1000);
    if (!rl.allowed) {
      await logAudit({
        userEmail: cleanEmail,
        action: "AUTH_LOGIN_RATE_LIMITED",
        entityType: "auth",
        ipAddress: ip,
        userAgent,
        status: "failed",
        newValues: { retryAfterSeconds: rl.retryAfterSeconds },
      });

      return NextResponse.json(
        {
          success: false,
          message: `Muitas tentativas de login. Tente novamente em ${rl.retryAfterSeconds} segundos.`,
        },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    try {
      await initAuthDatabase();
    } catch (dbInitErr) {
      console.error("Erro ao inicializar/verificar tabela de usuários:", dbInitErr);
      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível conectar ao banco de dados para autenticação.",
        },
        { status: 503 }
      );
    }

    const db = getDbPool();

    const [rows] = await db.query<UserRow[]>(
      "SELECT id, name, email, password, role, company_id, status FROM users WHERE LOWER(email) = ? LIMIT 1",
      [cleanEmail]
    );

    if (rows.length === 0) {
      await logAudit({
        userEmail: cleanEmail,
        action: "AUTH_LOGIN_FAILED",
        entityType: "auth",
        ipAddress: ip,
        userAgent,
        status: "failed",
        newValues: { reason: "Usuário não encontrado" },
      });

      return NextResponse.json(
        { success: false, message: "Usuário ou senha incorretos." },
        { status: 401 }
      );
    }

    const user = rows[0];

    if (user.status !== "active") {
      await logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        companyId: user.company_id,
        action: "AUTH_LOGIN_BLOCKED",
        entityType: "auth",
        entityId: user.id,
        ipAddress: ip,
        userAgent,
        status: "failed",
        newValues: { reason: "Conta inativa" },
      });

      return NextResponse.json(
        { success: false, message: "Conta desativada. Entre em contato com o suporte." },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      await logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        companyId: user.company_id,
        action: "AUTH_LOGIN_FAILED",
        entityType: "auth",
        entityId: user.id,
        ipAddress: ip,
        userAgent,
        status: "failed",
        newValues: { reason: "Senha incorreta" },
      });

      return NextResponse.json(
        { success: false, message: "Usuário ou senha incorretos." },
        { status: 401 }
      );
    }

    // Se a senha ainda estava em texto puro, faz upgrade transparente para hash bcrypt
    if (isLegacyPlainPassword(user.password)) {
      try {
        const newHash = await hashPassword(password);
        await db.query("UPDATE users SET password = ? WHERE id = ?", [newHash, user.id]);
      } catch (upgradeErr) {
        console.warn("Aviso ao atualizar hash da senha:", upgradeErr);
      }
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      companyId: user.company_id,
      action: "AUTH_LOGIN_SUCCESS",
      entityType: "auth",
      entityId: user.id,
      ipAddress: ip,
      userAgent,
      status: "success",
      newValues: { portalType: portalType || "default" },
    });

    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      const response = NextResponse.json({
        success: true,
        role: user.role,
        redirectTo: "/sa/inicio",
        message:
          portalType === "painel"
            ? "Operador do SaaS identificado. Redirecionando para /sa/inicio."
            : undefined,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });

      // Assinar e configurar cookies HttpOnly seguros
      const authToken = signSessionToken({ id: user.id, email: user.email, role: user.role });
      const isProduction = process.env.NODE_ENV === "production";

      response.cookies.set("sa_auth_token", authToken, {
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
      });
      response.cookies.set("sa_user_id", String(user.id), {
        path: "/",
        httpOnly: false,
        secure: isProduction,
        sameSite: "lax",
      });
      response.cookies.set("sa_user_email", user.email, {
        path: "/",
        httpOnly: false,
        secure: isProduction,
        sameSite: "lax",
      });
      return response;
    }

    if (portalType === "sa") {
      return NextResponse.json(
        {
          success: false,
          message: "Acesso negado. Esta conta não possui privilégios de acesso ao SaaS.",
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      role: user.role,
      redirectTo: "/painel",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
      },
    });

    const isProduction = process.env.NODE_ENV === "production";
    const authToken = signSessionToken({ id: user.id, email: user.email, role: user.role });

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
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no processamento de login:", message);
    return NextResponse.json(
      { success: false, message: "Erro interno no processamento do login." },
      { status: 500 }
    );
  }
}
