# MemÃ³ria do Projeto - Telas de AutenticaÃ§Ã£o

## 1. Dados do Projeto
- **Nome do Sistema:** JH7 Marketing
- **Descrição:** Gerenciamento de Marketing em Grupos de WhatsApp
- **Versão Atual:** `2026.08.0007`
- **Rodapé:** Desenvolvido por JH7

## 2. Visão Geral
Telas de autenticação desenvolvidas com estética moderna/glassmorphism dark mode, partículas e gradientes animados no fundo, divididas em duas colunas responsivas com distinção de identidade visual e conteúdo:

### A. Portal da Empresa (`/painel/login`)
- **Paleta de Cores:** Tons esmeralda / teal / slate escuro.
- **Coluna Esquerda:** Focada no usuário final e marketing em grupos de WhatsApp (automação de ofertas, disparos programados, proteção anti-bloqueio).
- **Coluna Direita:** Login com formulário com e-mail, senha e botão "Entrar no Painel".
- **Validação de Acesso:** Consulta direta à tabela `users` no MySQL com `mysql2/promise`. Redireciona para `/painel`.

### B. Super Admin SaaS (`/sa/login`)
- **Paleta de Cores:** Tons índigo / violeta / roxo profundo.
- **Coluna Esquerda:** Focada na gestão da plataforma SaaS (visão geral do ecossistema, controle central & multi-tenant, gestão de empresas, instâncias e filas).
- **Coluna Direita:** Login administrativo com botão "Entrar no Painel Super Admin".
- **Validação de Acesso:** Validação estrita via tabela `users` no MySQL para usuários com `role = 'SUPER_ADMIN'`. Redireciona para `/sa`.

## 3. Banco de Dados e Autenticação
- Módulo `src/lib/db.ts` gerencia o pool de conexões com MySQL.
- Criação e inicialização da tabela `users`.
- Autenticação 100% dinâmica via banco de dados sem credenciais hardcoded no código-fonte.
- Endpoint `src/app/api/auth/login/route.ts` valida credenciais contra o banco de dados e retorna os dados de sessão e redirecionamento correspondente ao perfil (`SUPER_ADMIN` -> `/sa`, `COMPANY_ADMIN`/`USER` -> `/painel`).

## 2. Rotas
- `/sa/login`: Tela de login do Super Admin do SaaS (Paleta Ãndigo/Violeta).
- `/painel/login`: Tela de login do Portal da Empresa / Cliente (Paleta Esmeralda/Teal).
- `/`: Redirecionamento padrÃ£o para `/painel/login`.

## 3. Componentes
- `src/components/auth/AnimatedBackground.tsx`: Suporta paletas dinÃ¢micas (`emerald` e `indigo`) com gradientes animados e partÃ­culas.
- `src/components/auth/AuthFormLayout.tsx`: ConfiguraÃ§Ã£o adaptÃ¡vel por tipo (`sa` vs `painel`) para textos, badges, Ã­cones e esquemas de cores.
