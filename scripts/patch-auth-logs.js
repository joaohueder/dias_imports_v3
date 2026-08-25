const fs = require('fs');

// 1. Atualizar AuthFormLayout.tsx com logs detalhados e redirecionamento robusto
const authFile = 'src/components/auth/AuthFormLayout.tsx';
let authContent = fs.readFileSync(authFile, 'utf8');

authContent = authContent.replace(
  'router.push(data.redirectTo || "/sa");',
  `console.log("[AUTH DEBUG] Login efetuado com sucesso!", data);
      window.location.href = data.redirectTo || "/sa";`
);

authContent = authContent.replace(
  'setIsLoading(true);\n\n    try {',
  `console.log("[AUTH DEBUG] Iniciando envio do formulário de login:", { email, portalType: type });
    setIsLoading(true);\n\n    try {`
);

authContent = authContent.replace(
  'const data = await response.json();',
  `console.log("[AUTH DEBUG] Resposta HTTP recebida:", response.status, response.statusText);
      const data = await response.json().catch(err => {
        console.error("[AUTH DEBUG] Erro ao decodificar JSON:", err);
        return { success: false, message: "Resposta inválida do servidor." };
      });
      console.log("[AUTH DEBUG] Payload retornado:", data);`
);

authContent = authContent.replace(
  '} catch {\n      setErrorMessage("Erro ao conectar com o servidor. Verifique sua conexão.");\n      setIsLoading(false);\n    }',
  `} catch (err) {
      console.error("[AUTH DEBUG] Exceção capturada ao tentar login:", err);
      setErrorMessage("Erro ao conectar com o servidor. Verifique o console.");
      setIsLoading(false);
    }`
);

fs.writeFileSync(authFile, authContent, 'utf8');
console.log('AuthFormLayout atualizado.');

// 2. Adicionar logs no endpoint /api/auth/login/route.ts
const routeFile = 'src/app/api/auth/login/route.ts';
let routeContent = fs.readFileSync(routeFile, 'utf8');

routeContent = routeContent.replace(
  'export async function POST(request: Request) {',
  `export async function POST(request: Request) {
  console.log("[API /api/auth/login] Recebida requisição POST para login...");`
);

routeContent = routeContent.replace(
  'const [rows] = await db.query<UserRow[]>(',
  `console.log("[API /api/auth/login] Buscando usuário:", cleanEmail);
    const [rows] = await db.query<UserRow[]>(`
);

routeContent = routeContent.replace(
  'if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {',
  `console.log("[API /api/auth/login] Usuário autenticado com sucesso:", { id: user.id, role: user.role, email: user.email });
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {`
);

fs.writeFileSync(routeFile, routeContent, 'utf8');
console.log('API login route atualizada.');
