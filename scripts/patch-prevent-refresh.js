const fs = require('fs');

const authFile = 'src/components/auth/AuthFormLayout.tsx';
let content = fs.readFileSync(authFile, 'utf8');

// Desativa temporariamente o window.location.href automático no submit para analisar o que acontece
content = content.replace(
  `      setTimeout(() => {
        window.location.href = data.redirectTo || "/sa";
      }, 500);`,
  `      addLog(\`5. SUCESSO! Clique no botão abaixo para acessar \${data.redirectTo || "/sa"}\`);
      setIsLoading(false);`
);

// Adiciona um botão manual de redirecionamento quando o login é sucesso
if (!content.includes('data.redirectTo && (')) {
  content = content.replace(
    `{/* Caixa de Diagnóstico Visual de Logs */}`,
    `{successMessage && (
              <a
                href="/sa"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <span>Acessar Painel Super Admin Agora &rarr;</span>
              </a>
            )}
            {/* Caixa de Diagnóstico Visual de Logs */}`
  );
}

fs.writeFileSync(authFile, content, 'utf8');
console.log('AuthFormLayout configurado sem reload automático para testes de debug.');
