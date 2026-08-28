### REGRAS OBRIGATÓRIAS DO PROJETO

## DADOS DO PROJETO
- Nome do sistema: JH7 Marketing
- Descrição: Gerenciamento de Marketing em Grupos de WhatsApp
- Usuário inicial super admin do saas: joaohueder@gmail.com
- Senha do super admin do saas: 123456
- Versão do sistema: 2026.08.0496

## VERSIONAMENTO DO SISTEMA
- Qualquer alteração no sistema deve mudar a versão do sistema, mantendo o padroão "ano.mes.incremento" exemplo: 2026.08.0001.
- Deve sempre atualizar a versão no rodape do sistema

## PADRÕES VISUAIS E UI/UX
- Padrão de Resolução Desktop Base (1200px Grid Standard): Como regra obrigatória de design, todas as telas do sistema devem ser rigorosamente concebidas e diagramadas pensando no breakpoint desktop de **1200px** como viewport de referência (com layout responsivo que expande elegantemente em resoluções maiores `max-w-7xl` / fluid).
- Proibição Absoluta de Barra de Rolagem Horizontal (No Horizontal Scrollbar Standard): Como regra obrigatória do projeto, NUNCA deve haver barra de rolagem horizontal em tabelas, cards, listagens ou containers em desktop base (1200px) e viewports comuns. Todas as colunas, células, botões de ação e textos devem ser diagramados harmonicamente (com larguras proporcionais, truncamento inteligente `truncate`, paddings otimizados `px-3 sm:px-4 py-3`, ícones compactos e alinhamentos perfeitos) para caberem 100% dentro da largura disponível sem forçar overflow horizontal.
- Sem Quebra de Linha em Botões (`whitespace-nowrap`): Todos os botões de ação, links, badges e tags interativas do sistema NUNCA devem quebrar linha em seu texto/conteúdo, mantendo `whitespace-nowrap`, espaçamentos consistentes, ícones com `shrink-0` e layout limpo, intuitivo e amigável.
- Padrão de Feedback por Modal (Modal Standard): Como padrão absoluto do projeto, TODO erro, aviso/informação e confirmação de ação deve ser apresentado ao usuário via Modal interativo (`FeedbackModalProvider` / `useFeedbackModal` ou modais dedicados de ação), garantindo foco, clareza e previsibilidade na experiência do usuário.
- Padrão de Avatar do Usuário (Avatar Standard): O avatar de usuário/operador em todo o sistema deve seguir rigorosamente o padrão visual do cabeçalho: fundo em gradiente suave translúcido `bg-gradient-to-br from-indigo-500/25 to-violet-500/25`, borda sutil `border border-indigo-500/40`, texto em tom suave `text-indigo-300 font-bold`, sombra interna `shadow-inner` e iniciais calculadas pelo primeiro e último nome (`getInitials`).
- Padrão de Cabeçalho das Telas (Header Standard): Todas as telas do painel Super Admin (`/sa/*`) e módulos do sistema devem seguir rigorosamente o padrão visual de cabeçalho unificado com layout vertical:
  1. Título com ícone estilizado, indicador de status/pulsing badge verde (`animate-ping`) quando aplicável e subtítulo explicativo com tipografia limpa.
  2. Linha inferior dedicada para as ações/botões, alinhada à direita (`w-full flex justify-end gap-2.5 pt-1`), contendo o botão principal "Atualizar" na cor roxa/indigo (`bg-indigo-600 hover:bg-indigo-500`) com ícone giratório `RefreshCw`, e botões de ação complementares ou links de criação (`Nova Empresa`, `Novo Usuário`, etc.), com linha divisória inferior `border-b border-slate-800/80`. Sempre utilize o componente padrão `SaPageHeader` (`src/components/sa/SaPageHeader.tsx`) ou estruture em bloco vertical equivalente.
- Padrão de Caixa de Filtros e Busca (Filter Bar Standard): Todas as telas de listagem, painéis e tabelas com busca e filtros devem seguir rigorosamente o padrão visual unificado:
  1. **Container Principal**: `rounded-2xl bg-[#090f1d]/90 border border-slate-800/80 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between`
  2. **Campo de Busca**: Input envolvido em `relative w-full sm:w-80` (ou `flex-1` quando apropriado), com ícone `Search` em `w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500`, e input com `w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50`.
  3. **Pills e Dropdowns de Filtro**: Envolvidos em containers de filtro com `flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-200`, com ícones temáticos (`Filter`, `Building2`, etc.) em `w-3.5 h-3.5 text-slate-400 shrink-0` e selects com `bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer`.
- Padrão de Paginação Obrigatório (10 itens por página): Todas as listagens, tabelas e visualizações de dados paginados do sistema DEVEM obrigatoriamente paginar os resultados de 10 em 10 itens (`PAGE_SIZE = 10` ou `limit = 10`), com controles visuais de paginação intuitivos (página atual, total de páginas, total de registros, botões Anterior/Próximo e navegação rápida) posicionados no rodapé da tabela/container.
- Padrão Visual e Tipográfico Obrigatório para Tabelas e Listas (Table & List Typography Standard):
  1. **Cabeçalho da Tabela (`thead`)**: Fundo escuro profundo `bg-[#0b1222]`, borda inferior `border-b border-slate-800/90`, texto `text-slate-400`, peso seminegrito `font-semibold`, caixa alta `uppercase`, rastreamento `tracking-wider`, tamanho `text-[10px]` e padding `px-5 py-3.5` (ou `px-4 py-3`).
  2. **Identificador / Avatar de Item**: Quadrado arredondado `w-10 h-10 rounded-xl` (ou `w-7 h-7` / `w-8 h-8` compacto), com gradiente temático `bg-gradient-to-tr from-indigo-500/20 to-violet-500/20` (ou variante do módulo), borda `border border-indigo-500/30`, texto `text-indigo-300 font-bold text-sm` shrink-0.
  3. **Título / Nome Principal**: `font-bold text-white text-sm group-hover:text-indigo-300 transition-colors`.
  4. **Subtítulo / Razão Social / Descritivo**: `text-[11px] text-slate-400`.
  5. **Metadados Secundários (Localização, Cidade, Ícones)**: `text-[10px] text-slate-500 flex items-center gap-1 mt-0.5`.
  6. **Documentos / Códigos / Telefones**: `font-mono text-slate-300 text-[11px]` (ou `text-xs`).
  7. **Pills de Planos / Categorias**: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold text-[11px]`.
  8. **Métricas e Limites Operacionais na Linha**: `space-y-1 text-[11px]` com ícones em `w-3.5 h-3.5` e texto em `text-slate-300` / `text-slate-400`.
  9. **Badges e Pílulas de Status**: Pílulas arredondadas `px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider` com bolinha indicadora `w-1.5 h-1.5 rounded-full` (ex: Ativa em `bg-emerald-500/15 text-emerald-300 border border-emerald-500/30`, bolinha `bg-emerald-400 animate-pulse`).
  10. **Ações de Linha**: Botões de ícone com `w-8 h-8 rounded-lg flex items-center justify-center` com `transition-all cursor-pointer shadow-sm active:scale-95 text-slate-400 hover:text-white hover:bg-slate-800` ou variantes de cor temáticas.
- Padrão Obrigatório de Máscaras em Campos de Telefone e WhatsApp (Phone & WhatsApp Mask Standard):
  1. **Todos** os campos de entrada (`input`), disparos de teste, formulários de perfil, cadastro de empresas, instâncias, usuários e login com telefone/WhatsApp DEVEM obrigatoriamente aplicar a máscara telefônica padrão brasileira `(00) 00000-0000` (ou formato internacional com DDD) em tempo real via `maskPhone()` (`src/lib/validators.ts`).
  2. Todos os campos correspondentes devem exibir `placeholder="(00) 00000-0000"` e sanitizar o valor para dígitos antes do envio/processamento na API caso necessário.
- Barra Flutuante de Ação (Salvar / Cancelar): Toda tela de formulário ou edição do sistema que possuir estado de alteração (`isDirty`) deve utilizar exclusivamente a barra flutuante padrão `FloatingActionBar` (`src/components/ui/FloatingActionBar.tsx`) para confirmação ou descarte de alterações, eliminando botões fixos duplicados na base do formulário. Quando houver campos obrigatórios não preenchidos ou falhas de validação, a barra flutuante deve ser exibida com o botão "Salvar" desabilitado (`disabled`), impedindo o envio até a correção dos erros.
- Modais de Confirmação Obrigatórios: Todas as ações de exclusão (delete) e mudança de status (ativar, inativar, suspender, expirar, etc.) em qualquer entidade do sistema DEVEM obrigatoriamente exigir confirmação explícita do usuário através de modal dedicado antes de executar a requisição.

## TESTES E VALIDAÇÕES
- Sempre teste o que está sendo entregue para que não há erros no sistema.

## DASHBOARD E MÉTRICAS & SAÚDE
- Sempre que houver alguma alteração/criação no projeto, se for interessante colocar no dashboard e nas métricas, coloque.

## MEMORIA DO PROJETO
- grave sempre os arquivos de memória na pasta "/doc/".

## BANCO DE DADOS
- Toda alteração no banco de dados deve gerar uma migration e garantir que nenhum dado seja perdido.
- Crie uma tela de aplicação de migration, se o sistema identificar um nova migration deve abrir uma tela de run-migration travando o sistema. sempre pedirá o acesso de um super admin saas para confirmar a execução.

