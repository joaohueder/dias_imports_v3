import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas do Super Admin e do Painel
  const isSaLogin = pathname === "/sa/login";
  const isPainelLogin = pathname === "/painel/login";
  const isSaRoute = pathname.startsWith("/sa");
  const isPainelRoute = pathname.startsWith("/painel");
  const isSaApi = pathname.startsWith("/api/sa");

  // Checagem de token/sessão para rotas de front do SA
  const saAuthToken = request.cookies.get("sa_auth_token")?.value;
  const saUserId = request.cookies.get("sa_user_id")?.value;
  const saUserEmail = request.cookies.get("sa_user_email")?.value;

  const hasSaSession = Boolean(saAuthToken || saUserId || saUserEmail);

  // 1. Proteger rotas frontend /sa (exceto login)
  if (isSaRoute && !isSaLogin) {
    if (!hasSaSession) {
      const loginUrl = new URL("/sa/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Redirecionar se já logado tentando acessar /sa/login
  if (isSaLogin && hasSaSession) {
    return NextResponse.redirect(new URL("/sa", request.url));
  }

  // 3. Proteger endpoints de API /api/sa (exceto health checks públicos se houver)
  if (isSaApi && !hasSaSession) {
    // Permite que a rota retorne 401 via session check no endpoint ou bloqueia antecipadamente
    // Deixamos prosseguir para que getCurrentSaUser() valide o banco ou retorne 401 padronizado
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/sa/:path*",
    "/painel/:path*",
    "/api/sa/:path*",
  ],
};
