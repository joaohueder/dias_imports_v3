### REGRAS OBRIGATÓRIAS DO PROJETO

## DADOS DO PROJETO
- Nome do sistema: JH7 Marketing
- Descrição: Gerenciamento de Marketing em Grupos de WhatsApp
- Usuário inicial super admin do saas: joaohueder@gmail.com
- Senha do super admin do saas: 123456
- Versão do sistema: 2026.08.0171

## VERSIONAMENTO DO SISTEMA
- Qualquer alteração no sistema deve mudar a versão do sistema, mantendo o padroão "ano.mes.incremento" exemplo: 2026.08.0001.
- Deve sempre atualizar a versão no rodape do sistema

## PADRÕES VISUAIS E UI/UX
- Padrão de Resolução Desktop Base (1200px Grid Standard): Como regra obrigatória de design, todas as telas do sistema devem ser rigorosamente concebidas e diagramadas pensando no breakpoint desktop de **1200px** como viewport de referência (com layout responsivo que expande elegantemente em resoluções maiores `max-w-7xl` / fluid).
- Sem Quebra de Linha em Botões (`whitespace-nowrap`): Todos os botões de ação, links, badges e tags interativas do sistema NUNCA devem quebrar linha em seu texto/conteúdo, mantendo `whitespace-nowrap`, espaçamentos consistentes, ícones com `shrink-0` e layout limpo, intuitivo e amigável.
- Padrão de Feedback por Modal (Modal Standard): Como padrão absoluto do projeto, TODO erro, aviso/informação e confirmação de ação deve ser apresentado ao usuário via Modal interativo (`FeedbackModalProvider` / `useFeedbackModal` ou modais dedicados de ação), garantindo foco, clareza e previsibilidade na experiência do usuário.
- Padrão de Avatar do Usuário (Avatar Standard): O avatar de usuário/operador em todo o sistema deve seguir rigorosamente o padrão visual do cabeçalho: fundo em gradiente suave translúcido `bg-gradient-to-br from-indigo-500/25 to-violet-500/25`, borda sutil `border border-indigo-500/40`, texto em tom suave `text-indigo-300 font-bold`, sombra interna `shadow-inner` e iniciais calculadas pelo primeiro e último nome (`getInitials`).
- Padrão de Cabeçalho das Telas (Header Standard): Todas as telas do painel Super Admin (`/sa/*`) devem seguir rigorosamente o padrão visual de cabeçalho unificado (Título com ícone estilizado, indicador de status/pulsing badge verde quando aplicável, subtítulo explicativo com tipografia limpa, linha divisória `border-b border-slate-800/80` e botões de ação à direita com botão principal "Atualizar" na cor roxa/indigo `bg-indigo-600 hover:bg-indigo-500` com ícone giratório `RefreshCw`, e botão de ação principal ou filtros complementares).
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

