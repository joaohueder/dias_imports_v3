import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Sessão encerrada com sucesso.",
    });

    // Limpar todos os cookies de autenticação do sistema
    const sessionCookies = [
      "sa_auth_token",
      "sa_user_id",
      "sa_user_email",
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
