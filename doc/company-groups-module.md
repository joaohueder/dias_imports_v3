# Módulo: Gerenciamento de Grupos de WhatsApp (/painel/grupos)

## Visão Geral
O módulo de grupos permite listar, importar em lote da instância WhatsApp conectada (via Evolution API v2.3.7), sincronizar dados em segundo plano, editar metadados e alterar rapidamente o status de cada grupo (`active`, `paused`).

## Funcionalidades
- **Importação em Lote Inteligente:** Busca todos os grupos da instância conectada via Evolution API (trazendo exclusivamente grupos abertos onde qualquer pessoa pode enviar mensagens). O modal conta com filtro padrão focado em **"Não cadastrado"**, com opções de alternar para **"Já cadastrado"** ou **"Todos"**, com seleção em lote e in-memory caching para carregamento instantâneo.
- **Sincronização em Fila & Detecção de Grupo Fechado:** Envia tarefa de sincronização para os background workers e filas do sistema (`processGroupSyncJob`). Ao sincronizar os metadados com a Evolution API, caso o grupo passe a estar fechado (`announce === true`), o tipo do grupo (`group_type`) é automaticamente atualizado para `"closed"` ("Fechado").
- **Visualização Padronizada de Envio:** Cada card exibe exclusivamente um dos dois estados de envio:
  - `Aberto | Todos envia` (badge verde esmeralda com ícone de mensagem)
  - `Fechado | Só Admin envia` (badge vermelho/rose com ícone de escudo)
- **Alteração Rápida de Status:** O badge de status do card é interativo. Ao clicar sobre o badge, abre um modal dedicado com opções descritivas (`Ativo`, `Pausado`) e botão de confirmação.
- **Exclusão Segura:** Modal de confirmação destrutiva antes da remoção do registro.
- **Operações Permitidas:** Adicionar grupos da instância, excluir, alterar status rápido e atualizar/sincronizar dados via WhatsApp.

## Troubleshooting — Geração de Tarefas
- A rotina automática chama `POST /api/sa/workers/process` com `queue_name: "whatsapp-groups-sync"` e `trigger_routine: true`.
- O endpoint cria uma tarefa `sync_group_<id>` por grupo e processa o lote; a resposta informa `enqueuedCount`, `processedCount` e `companyIds`.
- O payload JSON da tarefa registra empresa (`company`), instância (`instance`), grupo (`group`), ação (`action`) e origem (`createdBy`/`trigger`).
- Após a execução, o payload recebe `execution` com resultado, descrição do que foi feito, quantidade atualizada, delay e horário; falhas registram erro.
- Cada grupo possui retry, status e erro independentes; uma falha não bloqueia os demais grupos.
- O daemon precisa estar ativo via PM2 (`jh7-worker-daemon`). Em Windows, use `node .\\node_modules\\pm2\\bin\\pm2 start ecosystem.config.js`.
- O worker `w-groups-01` deve estar `active` com `schedule_enabled` habilitado.
- O dispatcher aplica o intervalo global configurado antes de consultar a Evolution API; a deduplicação por grupo bloqueia jobs `waiting`, `active` ou `delayed`.
- `processActiveQueues()` somente processa jobs persistidos; não cria health/grupos automaticamente em paralelo aos dispatchers.
- A sincronização manual também ignora grupos que já possuem job pendente, evitando repetição por cliques consecutivos.

## Troubleshooting — Cron de Assinaturas
- A fila `cron-subscriptions` é acionada pelo daemon conforme `schedule_interval_seconds`/`schedule_interval_minutes` do worker `w-cron-01`.
- O endpoint não cria uma tarefa nova a cada polling: mantém no máximo uma `verify_subscriptions` em `waiting`, `active` ou `delayed`.
- Após uma execução concluída, uma nova verificação só é criada quando o intervalo configurado tiver passado.
- O processamento geral das filas não cria mais tarefas de assinatura automaticamente; a criação fica centralizada no endpoint agendado.

## Arquivos Relacionados
- [src/app/painel/grupos/page.tsx](../src/app/painel/grupos/page.tsx): Tela e interface principal de gestão de grupos.
- [src/app/api/painel/grupos/[id]/route.ts](../src/app/api/painel/grupos/[id]/route.ts): Endpoint de atualização e exclusão de grupo.
- [src/app/api/painel/grupos/route.ts](../src/app/api/painel/grupos/route.ts): Endpoint de listagem e métricas de grupos.
