# MemÃ³ria do Projeto - Telas de AutenticaÃ§Ã£o

## 1. Dados do Projeto
- **Nome do Sistema:** JH7 Marketing
- **Descrição:** Gerenciamento de Marketing em Grupos de WhatsApp
- **Versão Atual:** `2026.08.0009`
- **Rodapé:** Desenvolvido por JH7

## 2. Visão Geral
Telas de autenticação desenvolvidas com estética moderna/glassmorphism dark mode, partículas e gradientes animados no fundo, divididas em duas colunas responsivas com distinção de identidade visual e conteúdo:

### A. Portal da Empresa (`/painel/login`)
- **Paleta de Cores:** Tons esmeralda / teal / slate escuro.
- **Método de Autenticação:** OTP (One-Time Password) via WhatsApp com código de 6 dígitos numéricos.
- **Fluxo do Usuário:**
  1. Digita o WhatsApp corporativo cadastrado (com máscara automática).
  2. Sistema valida existência e status ativo da empresa e do usuário.
  3. Envia código temporário de 6 dígitos (válido por 10 minutos).
  4. Usuário digita o código OTP recebido e acessa diretamente o `/painel`.

### B. Super Admin SaaS (`/sa/login`)
- **Paleta de Cores:** Tons índigo / violeta / roxo profundo.
- **Método de Autenticação:** E-mail e Senha de Super Admin (`joaohueder@gmail.com` / `123456`).
- **Validação de Acesso:** Validação estrita via tabela `users` no MySQL para usuários com `role = 'SUPER_ADMIN'`. Redireciona para `/sa`.

## 3. Cadastro e Unicidade de WhatsApp no Super Admin (`/sa/companies`)
- Removido campo de telefone convencional.
- **WhatsApp da Empresa:** Número institucional para contato e notificações gerais.
- **WhatsApp de Acesso Admin:** Número exclusivo e obrigatório para autenticação OTP do administrador da empresa.
- **Regra de Unicidade Global:** Validação no backend e frontend impedindo cadastrar o mesmo WhatsApp de acesso admin para mais de uma empresa em todo o sistema.

## 4. Migrations do Banco de Dados
- `0004_add_admin_whatsapp_and_otp_to_users_and_companies.sql`: Adiciona campos `admin_whatsapp` (UNIQUE) em `companies`, e `whatsapp` (UNIQUE), `otp_code` e `otp_expires_at` em `users`.

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
