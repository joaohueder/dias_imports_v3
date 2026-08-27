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

## Arquivos Relacionados
- [src/app/painel/grupos/page.tsx](../src/app/painel/grupos/page.tsx): Tela e interface principal de gestão de grupos.
- [src/app/api/painel/grupos/[id]/route.ts](../src/app/api/painel/grupos/[id]/route.ts): Endpoint de atualização e exclusão de grupo.
- [src/app/api/painel/grupos/route.ts](../src/app/api/painel/grupos/route.ts): Endpoint de listagem e métricas de grupos.
