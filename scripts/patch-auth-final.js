const fs = require('fs');

// 1. Atualizar AuthFormLayout para redirecionamento imediato e suave pós-login
const authFile = 'src/components/auth/AuthFormLayout.tsx';
let authContent = fs.readFileSync(authFile, 'utf8');

// Ajusta para fazer o redirect automático imediatamente ao receber o token 200 OK
authContent = authContent.replace(
  `      addLog(\`5. SUCESSO! Clique no botão abaixo para acessar \${data.redirectTo || "/sa"}\`);
      setIsLoading(false);`,
  `      addLog(\`5. SUCESSO! Redirecionando para \${data.redirectTo || "/sa"}...\`);
      window.location.href = data.redirectTo || "/sa";`
);

fs.writeFileSync(authFile, authContent, 'utf8');
console.log('AuthFormLayout configurado com redirecionamento automático.');

// 2. Garantir que os cookies em /api/auth/login sejam compatíveis tanto com HTTP (localhost/IP) quanto com HTTPS (produção)
const routeFile = 'src/app/api/auth/login/route.ts';
let routeContent = fs.readFileSync(routeFile, 'utf8');

const oldCookieSetup = `      // Assinar e configurar cookies HttpOnly seguros
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
      });`;

const newCookieSetup = `      // Assinar e configurar cookies seguros
      const authToken = signSessionToken({ id: user.id, email: user.email, role: user.role });
      // Se estiver acessando via HTTP puro (ex: IP direto ou sem SSL), secure: true impediria o browser de salvar o cookie
      const isHttps = request.url.startsWith("https://");

      response.cookies.set("sa_auth_token", authToken, {
        path: "/",
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });
      response.cookies.set("sa_user_id", String(user.id), {
        path: "/",
        httpOnly: false,
        secure: isHttps,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      response.cookies.set("sa_user_email", user.email, {
        path: "/",
        httpOnly: false,
        secure: isHttps,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });`;

routeContent = routeContent.replace(oldCookieSetup, newCookieSetup);
fs.writeFileSync(routeFile, routeContent, 'utf8');
console.log('Login route atualizada com detecção dinâmica de HTTPS.');
