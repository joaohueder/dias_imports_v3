### REGRAS OBRIGATÓRIAS DO PROJETO

## DADOS DO PROJETO
- Nome do sistema: JH7 Marketing
- Descrição: Gerenciamento de Marketing em Grupos de WhatsApp
- Usuário inicial super admin do saas: joaohueder@gmail.com
- Senha do super admin do saas: 123456
- Versão do sistema: 2026.08.0026

## VERSIONAMENTO DO SISTEMA
- Qualquer alteração no sistema deve mudar a versão do sistema, mantendo o padroão "ano.mes.incremento" exemplo: 2026.08.0001.
- Deve sempre atualizar a versão no rodape do sistema

## PADRÕES VISUAIS E UI/UX
- Barra Flutuante de Ação (Salvar / Cancelar): Toda tela de formulário ou edição do sistema que possuir estado de alteração (`isDirty`) deve utilizar exclusivamente a barra flutuante padrão `FloatingActionBar` (`src/components/ui/FloatingActionBar.tsx`) para confirmação ou descarte de alterações, eliminando botões fixos duplicados na base do formulário.

## TESTES E VALIDAÇÕES
- Sempre teste o que está sendo entregue para que não há erros no sistema.

## DASHBOARD E MÉTRICAS & SAÚDE
- Sempre que houver alguma alteração/criação no projeto, se for interessante colocar no dashboard e nas métricas, coloque.

## MEMORIA DO PROJETO
- grave sempre os arquivos de memória na pasta "/doc/".

## BANCO DE DADOS
- Toda alteração no banco de dados deve gerar uma migration e garantir que nenhum dado seja perdido.
- Crie uma tela de aplicação de migration, se o sistema identificar um nova migration deve abrir uma tela de run-migration travando o sistema. sempre pedirá o acesso de um super admin saas para confirmar a execução.

