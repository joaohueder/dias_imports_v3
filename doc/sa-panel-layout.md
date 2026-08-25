# Documentação e Memória: Painel Super Admin (/sa)

**Data:** 2026-08-25  
**Versão:** 2026.08.0004  
**Responsável Técnico:** JH7-DESENVOLVEDOR, JH7-DESIGNER, JH7-MESTRE-DOCUMENTACAO  

---

## 1. Estrutura do Layout

O painel `/sa` (Super Admin) foi estruturado seguindo as diretrizes de governança, escalabilidade e design system moderno:

- **Header Fixo (`fixed top-0 h-16`):**
  - Identidade visual (JH7 Marketing com badge Super Admin).
  - Status em tempo real do banco de dados (`DatabaseStatusIndicator`).
  - Perfil do Super Admin logado e botão de saída/logout (`/sa/login`).
  - Botão responsivo para alternar menu lateral no mobile.

- **Barra de Menu Lateral (`aside fixed top-16 bottom-12 w-64` ou `w-20` recolhido):**
  - Navegação organizada por categorias:
    1. *Visão Geral:* Dashboard (`/sa`), Métricas & Saúde (`/sa/health`).
    2. *Governança & Tenants:* Empresas (`/sa/tenants`), Planos (`/sa/plans`), Super Admins (`/sa/users`).
    3. *Infra & Banco de Dados:* Migrations & DB (`/sa/migrations`), Instâncias (`/sa/instances`), Chaves API (`/sa/api-keys`), Logs (`/sa/logs`).
    4. *Configurações:* Parâmetros do SaaS (`/sa/settings`).
  - Suporte a recolhimento (collapse) e drawer responsivo para mobile.

- **Área Principal (`main`):**
  - Margem compensada para o sidebar (`md:ml-64` ou `md:ml-20`).
  - Container responsivo (`max-w-7xl`) com scroll independente.

- **Footer Fixo (`fixed bottom-0 h-12`):**
  - Assinatura do SaaS.
  - Tag de versão `v2026.08.0004`.
  - Copyright e status de governança.

---

## 2. Arquivos Criados / Modificados

- [src/components/sa/SaLayoutClient.tsx](src/components/sa/SaLayoutClient.tsx) - Componente cliente de casca completa com header fixo, sidebar retrátil/responsivo, main e footer fixo. Ignora a renderização do sidebar/header quando na rota `/sa/login` para isolamento total da tela de login após logoff.
- [src/app/sa/layout.tsx](src/app/sa/layout.tsx) - Layout Server Component de Next.js integrando o painel `/sa`.
- [src/app/sa/page.tsx](src/app/sa/page.tsx) - Dashboard inicial com métricas de tenants, banco de dados, instâncias e status de serviços.
