# Memória do Projeto - Telas de Autenticação

## 1. Dados do Projeto
- **Nome do Sistema:** JH7 Marketing
- **Descrição:** Gerenciamento de Marketing em Grupos de WhatsApp
- **Versão Atual:** `2026.08.0609`
- **Rodapé:** Desenvolvido por JH7

## 2. Visão Geral
Telas de autenticação desenvolvidas com estética moderna/glassmorphism dark mode, partículas e gradientes animados no fundo, divididas em duas colunas responsivas com distinção de identidade visual e conteúdo:

### A. Portal da Empresa (`/painel/login`)
- **Paleta de Cores:** Tons esmeralda / teal / slate escuro.
- **Métodos de Autenticação Disponíveis:**
  1. **OTP (One-Time Password) via WhatsApp:** Código numérico de 6 dígitos enviado através da instância padrão do WhatsApp configurada (válido por 10 minutos).
  2. **Códigos Reservas de Emergência:** 10 códigos únicos (`XXXX-XXXX`) atribuídos à empresa. Os códigos **não expiram e podem ser utilizados mais de uma vez** (reutilizáveis).
- **Fluxo do Usuário:**
  - Usuário pode alternar livremente entre "Via WhatsApp (OTP)" e "Via Código Reserva".
  - Se a instância padrão estiver desconectada (`disconnected`), o sistema detecta automaticamente no envio de OTP e orienta/alterna o usuário para login com Códigos Reservas.
  - Ao validar o código reserva com sucesso, o contador de uso do código é incrementado (`usage_count++`), a data de último uso registrada e a sessão autenticada da empresa é inicializada normalmente.

### B. Super Admin SaaS (`/sa/login`)
- **Paleta de Cores:** Tons índigo / violeta / roxo profundo.
- **Método de Autenticação:** E-mail e Senha de Super Admin (`joaohueder@gmail.com` / `123456`).
- **Validação de Acesso:** Validação estrita via tabela `users` no MySQL para usuários com `role = 'SUPER_ADMIN'`. Redireciona para `/sa`.

## 3. Códigos Reservas por Empresa (`companies.backup_codes`)
- Toda empresa criada no sistema recebe automaticamente 10 códigos reservas de 8 caracteres alfanuméricos com hífen (`XXXX-XXXX`).
- **Reutilização & Validade:** Os códigos reservas **não possuem validade temporal e podem ser reutilizados múltiplas vezes**. Cada login via código incrementa o contador de acessos e salva o último horário de acesso.
- Os códigos permanecem válidos até que o Super Admin ou o usuário da empresa clique em "Regenerar Códigos".
- Os códigos são gerenciados tanto no **Super Admin** (`/sa/companies/[id]`) quanto nas **Configurações da Empresa** (`/painel/configuracoes/empresa`).
- Ações suportadas:
  - Visualização de status de cada código (Ativo vs Usado com data).
  - Copiar todos os códigos para a área de transferência.
  - Baixar arquivo `.txt` formatado contendo os códigos e orientações.
  - Regeneração com invalidação imediata dos códigos anteriores (com confirmação explícita).

## 4. Endpoints da API de Autenticação e Códigos
- `POST /api/auth/otp/send`: Envia OTP de 6 dígitos via Evolution API. Se a instância padrão estiver offline, responde com status 503 e `{ instanceDisconnected: true }`.
- `POST /api/auth/backup-code/verify`: Valida WhatsApp de acesso admin + código reserva, consome o código e estabelece a sessão segura.
- `POST /api/painel/empresa/backup-codes`: Regenera a lista de 10 códigos da empresa logada.
- `POST /api/sa/companies/[id]/backup-codes`: Regenera a lista de 10 códigos de qualquer empresa pelo Super Admin.

## 3. Banco de Dados e Autenticação
- Módulo `src/lib/db.ts` gerencia o pool de conexões com MySQL.
- Criação e inicialização da tabela `users`.
- Autenticação 100% dinâmica via banco de dados sem credenciais hardcoded no código-fonte.
- Endpoint `src/app/api/auth/login/route.ts` valida credenciais contra o banco de dados e retorna os dados de sessão e redirecionamento correspondente ao perfil (`SUPER_ADMIN` -> `/sa`, `COMPANY_ADMIN`/`USER` -> `/painel`).
- Endpoint `src/app/api/auth/logout/route.ts` (POST) encerra e invalida cookies de sessão de autenticação, limpando caches e redirecionando o usuário para a tela de login.

## 2. Rotas
- `/sa/login`: Tela de login do Super Admin do SaaS (Paleta Ãndigo/Violeta).
- `/painel/login`: Tela de login do Portal da Empresa / Cliente (Paleta Esmeralda/Teal).
- `/`: Redirecionamento padrÃ£o para `/painel/login`.

## 3. Componentes
- `src/components/auth/AnimatedBackground.tsx`: Suporta paletas dinÃ¢micas (`emerald` e `indigo`) com gradientes animados e partÃ­culas.
- `src/components/auth/AuthFormLayout.tsx`: ConfiguraÃ§Ã£o adaptÃ¡vel por tipo (`sa` vs `painel`) para textos, badges, Ã­cones e esquemas de cores.
