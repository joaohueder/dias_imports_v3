import { NextResponse } from "next/server";
import { getCurrentSaUser } from "@/lib/session";
import { logAudit, getClientIpAndAgent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentSaUser();
    const { ip, userAgent } = getClientIpAndAgent(request);

    if (user) {
      await logAudit({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        companyId: user.company_id,
        action: "AUTH_LOGOUT",
        entityType: "auth",
        entityId: user.id,
        ipAddress: ip,
        userAgent,
        status: "success",
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Sessão encerrada com sucesso.",
    });

    // Limpar todos os cookies de autenticação do sistema
    const sessionCookies = [
      "sa_auth_token",
      "sa_user_id",
      "sa_user_email",
      "company_auth_token",
      "company_user_id",
      "company_id",
      "auth_token",
      "session_token",
      "sa_session",
      "user_session",
      "next-auth.session-token",
    ];

    sessionCookies.forEach((cookieName) => {
      response.cookies.set({
        name: cookieName,
        value: "",
        path: "/",
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao encerrar sessão";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
