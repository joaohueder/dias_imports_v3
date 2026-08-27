# Módulo: Painel da Empresa (/painel)

## Visão Geral
O painel da empresa em `/painel` é o portal exclusivo voltado para os clientes e tenants do **JH7 Marketing**. Ele permite a visualização centralizada da telemetria de conexões de WhatsApp (Evolution API v2.3.7), acompanhamento de mensagens enviadas e recebidas, gestão dos membros da equipe e monitoramento de automações e campanhas em grupos.

## Padrões de Design e UI/UX Aplicados
- **1200px Grid Standard (`max-w-7xl`):** Layout desenhado para alta densidade e ergonomia visual.
- **Paleta de Cores:** Foco em tons Esmeralda, Teal e Ciano (`from-emerald-500/20`, `border-emerald-500/30`), diferenciando do painel Super Admin (`/sa`).
- **Padrão de Avatar:** Iniciais com gradiente suave translúcido `bg-gradient-to-br from-indigo-500/25 to-violet-500/25` e borda sutil.
- **Indicadores em Tempo Real:** Conexão com banco de dados MySQL, Redis, Evolution API e WhatsApp Matriz.
- **Modal de Confirmação de Logout:** Encerramento seguro da sessão preservando as conexões do servidor.

## Autenticação e Segurança
- Acesso autenticado via código OTP de 6 dígitos enviado por WhatsApp ou credenciais autorizadas.
- Cookies de sessão HTTP-Only (`company_auth_token`, `company_user_id`, `company_id`) assinados via HMAC-SHA256.
- Recurso de **Impersonalização** para operadores Super Admin com permissão `companies:impersonate`. O acesso abre em nova janela com banner fixo de alerta no topo do painel da empresa indicando que o modo impersonado está ativo.
- Proteção por middleware em rotas frontend `/painel/*`.
- Rastreamento e auditoria em `audit_logs` para todos os eventos de acesso e impersonação.

## Arquivos Relacionados
- [src/app/painel/page.tsx](../src/app/painel/page.tsx): Tela principal do dashboard da empresa.
- [src/components/painel/PainelLayoutClient.tsx](../src/components/painel/PainelLayoutClient.tsx): Shell e layout padrão do portal da empresa com aviso de impersonação.
- [src/app/api/sa/companies/[id]/impersonate/route.ts](../src/app/api/sa/companies/[id]/impersonate/route.ts): Endpoint seguro para emissão de sessão e impersonação.
- [src/app/api/painel/dashboard/route.ts](../src/app/api/painel/dashboard/route.ts): Endpoint de agregação de KPIs, instâncias e equipe do tenant.
