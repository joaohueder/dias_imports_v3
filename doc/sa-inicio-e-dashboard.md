# Documentação de Governança: Página Início e Dashboard Reformulado

## 1. Visão Geral das Alterações
- **Página Pública de Abertura (`/sa/inicio`)**:
  - Nova página de onboarding com saudação personalizada pelo nome do usuário, avatar dinâmico e cards rápidos de navegação.
  - O fluxo de login e redirecionamento agora envia o usuário autenticado diretamente para `/sa/inicio`.
  - Inserida na barra lateral como item público "Início" no topo antes de "Visão Geral".

- **Dashboard Redesenhado (`/sa`)**:
  - Nova estética premium com glow effects, microinterações, gradientes e ícones dinâmicos do Lucide.
  - Integrado com o componente `LockedCard` (`src/components/sa/LockedCard.tsx`), que substitui os módulos aos quais o usuário não tem permissão (`companies`, `subscriptions`, `plans`, `health`) por um card estilizado do mesmo tamanho com a mensagem "SEM ACESSO", badges e ícones animados (`Ghost` flutuante e `SmilePlus` piscando).

- **Controle de Versão**:
  - Versão atualizada para `2026.08.0199` em `regras.md` e `src/lib/config.ts`.
