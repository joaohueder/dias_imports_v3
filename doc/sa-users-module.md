# Módulo: Usuários do Sistema SaaS (Super Admin & Admin)

**Documento:** `doc/sa-users-module.md`  
**Versão Inicial:** `2026.08.0064`  
**Autor:** JH7  
**Skill Responsável:** `JH7-DESENVOLVEDOR`, `JH7-DESIGNER`, `JH7-SECURITY-GUARDIAN`, `JH7-MESTRE-DOCUMENTACAO`

---

## 1. Visão Geral
O módulo de **Usuários do Sistema** (`/sa/users`) é responsável pelo gerenciamento central de operadores da plataforma SaaS.

Ele estabelece duas categorias de papéis para os usuários do backoffice:
1. **Super Admin (`SUPER_ADMIN`)**: Acesso irrestrito e total a todos os módulos, bancos de dados, migrations, instâncias e configurações globais.
2. **Admin (`ADMIN`)**: Acesso controlado com matriz de permissões granulares por módulo (`dashboard`, `health`, `companies`, `plans`, `subscriptions`, `users`, `migrations`, `instances`, `api_keys`, `logs`, `settings`) e por ação (`view`, `create`, `edit`, `delete`).

---

## 2. Estrutura do Banco de Dados

### Tabela `users`
- `id`: Chave primária.
- `name`: Nome do operador.
- `email`: E-mail de login único.
- `whatsapp`: Número de WhatsApp único para notificações e 2FA.
- `password`: Senha de autenticação.
- `role`: ENUM(`SUPER_ADMIN`, `ADMIN`, `COMPANY_ADMIN`, `USER`).
- `permissions`: Coluna JSON contendo o mapa de permissões do usuário quando `role = 'ADMIN'`.
- `status`: ENUM(`active`, `inactive`).
- `created_at` e `updated_at`.

### Migration de Referência
- `src/lib/migrations/0008_add_permissions_and_system_role_to_users.sql`

---

## 2.1. Regras Críticas de Auto-Proteção e Segurança
Por segurança operacional e para evitar auto-bloqueio ou perda irreversível de controle:
- **E-mail imutável na edição**: O campo de e-mail é utilizado unicamente durante o cadastro (`/sa/users/new`), com validação de unicidade global. Na tela de edição (`/sa/users/[id]`), o e-mail torna-se somente-leitura (`disabled`), garantindo a rastreabilidade do operador.
- **Máscara padrão de WhatsApp**: O campo WhatsApp utiliza a máscara obrigatória do sistema `(00) 00000-0000` via `maskPhone()`.
- **Não é permitido excluir a própria conta**: Ao tentar excluir o próprio usuário, a API retorna `HTTP 400 - Não é permitido excluir o próprio usuário conectado.` e os botões de exclusão são desabilitados/ocultados no frontend.
- **Não é permitido inativar a própria conta**: Ao tentar inativar o próprio usuário, a API retorna `HTTP 400 - Não é permitido inativar seu próprio usuário conectado.` e o seletor de status é travado no frontend.
- **Não é permitido alterar o próprio papel**: Ao tentar rebaixar ou alterar o próprio papel no sistema (`SUPER_ADMIN` / `ADMIN`), a API retorna `HTTP 400 - Não é permitido alterar o papel do próprio usuário.` e o seletor de papel é bloqueado na tela de edição, instruindo que outro Super Admin realize a modificação.

---

## 3. Matriz de Permissões Granular (`src/lib/permissions.ts`)
| Módulo | Ações Disponíveis | Categoria |
| :--- | :--- | :--- |
| **Dashboard** | `view` | Visão Geral |
| **Métricas & Saúde** | `view` | Visão Geral |
| **Empresas (Tenants)** | `view`, `create`, `edit`, `delete` | Governança & Tenants |
| **Planos de Acesso** | `view`, `create`, `edit`, `delete` | Governança & Tenants |
| **Assinaturas** | `view`, `create`, `edit`, `delete` | Governança & Tenants |
| **Usuários (SaaS)** | `view`, `create`, `edit`, `delete` | Governança & Tenants |
| **Migrations & DB** | `view`, `create`, `edit`, `delete` | Infra & Banco de Dados |
| **Instâncias & Workers** | `view`, `create`, `edit`, `delete` | Infra & Banco de Dados |
| **Chaves de API & Webhooks** | `view`, `create`, `edit`, `delete` | Infra & Banco de Dados |
| **Logs de Auditoria** | `view` | Infra & Banco de Dados |
| **Parâmetros do SaaS** | `view`, `edit` | Configurações |

---

## 4. Endpoints da API
- `GET /api/sa/users`: Lista usuários SaaS com suporte a filtros por `role`, `status` e termo de busca `search`.
- `GET /api/sa/users/check-email`: Verificação assíncrona de disponibilidade de e-mail em tempo real (`onBlur`).
- `POST /api/sa/users`: Criação de novo usuário com validação de unicidade de e-mail/whatsapp e armazenamento de permissões JSON.
- `GET /api/sa/users/[id]`: Detalhes de um usuário e suas permissões configuradas.
- `PUT /api/sa/users/[id]`: Atualização cadastral, troca de papel e sincronização de permissões.
- `DELETE /api/sa/users/[id]`: Exclusão com proteção para não excluir o último Super Admin ativo.
- `PATCH /api/sa/users/[id]/status`: Ativação/Inativação com modal de confirmação.

---

## 5. UI/UX e Governança Visual
- Menu do Sidebar atualizado para **"Usuários"**.
- Listagem em cards com visualizador rápido de permissões ativas em modal.
- Telas de criação (`/sa/users/new`) e edição (`/sa/users/[id]`) com barra de ação flutuante (`FloatingActionBar`).
- **Matriz de Permissões Granular (`PermissionMatrix`)**:
  - Organização por categorias funcionais (Visão Geral, Governança & Tenants, Infra & Banco de Dados, Configurações).
  - Ações rápidas no toolbar: *Acesso Total*, *Apenas Leitura* e *Limpar*.
  - Barra de progresso e estatísticas em tempo real com contador e porcentagem de privilégios concedidos.
  - Filtro de busca instantâneo com campo de texto e botão de limpar.
  - Chips de ação semânticos com ícones e cores dedicadas (`view`: Sky/Eye, `create`: Emerald/Plus, `edit`: Amber/Pencil, `delete`: Rose/Trash2).
  - Controle de colapso/expansão por categoria e alternância em lote por módulo ou categoria.
  - Banner informativo inteligente para perfil `SUPER_ADMIN` (Acesso Irrestrito Nativo).
