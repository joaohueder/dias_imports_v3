# Módulo de Configuração Meta Ads & Pixel (WhatsApp Marketing SaaS)

## 1. Visão Geral
O módulo **Meta Ads & Pixel** (`/painel/configuracoes/meta-ads`) permite que os clientes/tenants configurem o rastreamento avançado de campanhas de tráfego pago (Meta Ads / Facebook / Instagram) em suas landing pages públicas (`/p/[slug]`).

## 2. Recursos e Funcionalidades
1. **Ativação / Inativação Global do Rastreamento**:
   - Controle direto liga/desliga (`meta_pixel_active`) para suspender ou reativar os disparos sem perder as chaves cadastradas.
2. **Pixel do Meta (Facebook/Instagram)**:
   - Inserção dinâmica via tag `Script` com eventos padrão: `PageView` e `ViewContent` no acesso à página pública.
3. **API de Conversões do Servidor (Meta CAPI)**:
   - Disparos simultâneos de backend via rota `/api/public/produtos/[id]/meta-event` garantindo bypass de ad-blockers e navegadores com restrições de cookies.
   - Suporte a código de eventos de teste (`meta_pixel_test_code`) para depuração no Gerenciador de Eventos da Meta.
4. **Rastreamento de Leads / Cliques no WhatsApp**:
   - Evento `Lead` disparado automaticamente no momento em que o visitante clica no botão CTA para chamar no WhatsApp ou acessar a oferta.

## 3. Estrutura de Banco de Dados
- Tabela `companies`:
  - `meta_pixel_id` VARCHAR(50) NULL
  - `meta_pixel_access_token` TEXT NULL
  - `meta_pixel_test_code` VARCHAR(50) NULL
  - `meta_pixel_active` BOOLEAN NOT NULL DEFAULT FALSE

## 4. Endpoints
- `GET /api/painel/configuracoes/meta-ads`: Retorna as configurações do Meta Ads da empresa.
- `PUT /api/painel/configuracoes/meta-ads`: Salva chaves e status de ativação com auditoria.
- `POST /api/public/produtos/[id]/meta-event`: Endpoint público seguro para disparo de eventos na Meta Conversions API (CAPI).
