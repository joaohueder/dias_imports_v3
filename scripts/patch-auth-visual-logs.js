const fs = require('fs');

// 1. Atualizar AuthFormLayout.tsx com logs na tela + alerta e sem recarregamento imediato
const authFile = 'src/components/auth/AuthFormLayout.tsx';
let authContent = fs.readFileSync(authFile, 'utf8');

// Adiciona state de logs visíveis e interceptador de logs
const stateInjection = `  const [authLogs, setAuthLogs] = useState<string[]>([]);
  const addLog = (msg: string) => {
    console.log(msg);
    setAuthLogs((prev) => [...prev.slice(-15), \`[\${new Date().toLocaleTimeString()}] \${msg}\`]);
  };`;

if (!authContent.includes('const [authLogs, setAuthLogs]')) {
  authContent = authContent.replace('const [errorMessage, setErrorMessage] = useState("");', 'const [errorMessage, setErrorMessage] = useState("");\n' + stateInjection);
}

// Substitui handleSaasSubmit
const oldHandleSaas = `  // Login Super Admin (E-mail e Senha)
  const handleSaasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    console.log("[AUTH DEBUG] Iniciando envio do formulário de login:", { email, portalType: type });
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portalType: type }),
      });

      console.log("[AUTH DEBUG] Resposta HTTP recebida:", response.status, response.statusText);
      const data = await response.json().catch(err => {
        console.error("[AUTH DEBUG] Erro ao decodificar JSON:", err);
        return { success: false, message: "Resposta inválida do servidor." };
      });
      console.log("[AUTH DEBUG] Payload retornado:", data);

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Falha na autenticação.");
        setIsLoading(false);
        return;
      }

      console.log("[AUTH DEBUG] Login efetuado com sucesso!", data);
      window.location.href = data.redirectTo || "/sa";
    } catch (err) {
      console.error("[AUTH DEBUG] Exceção capturada ao tentar login:", err);
      setErrorMessage("Erro ao conectar com o servidor. Verifique o console.");
      setIsLoading(false);
    }
  };`;

const newHandleSaas = `  // Login Super Admin (E-mail e Senha)
  const handleSaasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    addLog(\`1. Iniciando login para \${email}...\`);
    setIsLoading(true);

    try {
      addLog("2. Enviando POST para /api/auth/login...");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portalType: type }),
      });

      addLog(\`3. Status HTTP recebido: \${response.status} \${response.statusText}\`);
      const data = await response.json().catch(err => {
        addLog(\`ERRO ao ler JSON da resposta: \${String(err)}\`);
        return { success: false, message: "Resposta inválida do servidor." };
      });

      addLog(\`4. Resposta da API: \${JSON.stringify(data)}\`);

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Falha na autenticação.");
        addLog(\`FALHA: \${data.message || "Credenciais inválidas"}\`);
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Login autorizado! Redirecionando...");
      addLog(\`5. SUCESSO! Redirecionando para \${data.redirectTo || "/sa"}...\`);
      
      setTimeout(() => {
        window.location.href = data.redirectTo || "/sa";
      }, 500);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      addLog(\`EXCEÇÃO de rede/fetch: \${errMsg}\`);
      setErrorMessage(\`Erro ao conectar: \${errMsg}\`);
      setIsLoading(false);
    }
  };`;

authContent = authContent.replace(oldHandleSaas, newHandleSaas);

// Adicionar caixa visual de logs abaixo do formulário de login
const debugBox = `
            {/* Caixa de Diagnóstico Visual de Logs */}
            {authLogs.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-slate-950/90 border border-indigo-500/30 text-[11px] font-mono text-slate-300 space-y-1 max-h-36 overflow-y-auto">
                <div className="text-indigo-400 font-bold flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                  <span>Diagnóstico em Tempo Real</span>
                  <span className="text-[10px] text-slate-500">Auto-scroll</span>
                </div>
                {authLogs.map((log, i) => (
                  <div key={i} className="text-slate-300 break-all">{log}</div>
                ))}
              </div>
            )}`;

if (!authContent.includes('Diagnóstico em Tempo Real')) {
  authContent = authContent.replace(
    '</form>',
    debugBox + '\n          </form>'
  );
}

fs.writeFileSync(authFile, authContent, 'utf8');
console.log('AuthFormLayout atualizado com caixa de logs visual e persistente.');
