# Módulo: Modelos de Mensagens Mestres (SaaS)

## Visão Geral
O módulo `/sa/message-templates` permite que os Administradores do SaaS gerenciem o catálogo mestre de templates de ofertas e mensagens WhatsApp.

## Regra de Snapshot no Onboarding
1. Quando uma nova empresa (tenant) é cadastrada pelo Super Admin em `/api/sa/companies` (POST):
   - O sistema busca todos os modelos com `status = 'active'` na tabela `sa_message_templates`.
   - Clona cada modelo para a tabela `company_message_templates` associado ao `company_id` recém-criado.
2. Caso uma empresa antiga ainda não tenha modelos cadastrados ao acessar o painel (`/api/painel/configuracoes/modelos`), o endpoint clona automaticamente os modelos ativos da `sa_message_templates`.
3. As alterações feitas pelo tenant em seus próprios modelos não afetam os modelos mestres do SaaS (isolamento completo).

## Estrutura do Banco de Dados
- Tabela: `sa_message_templates`
  - `id`: INT AUTO_INCREMENT PRIMARY KEY
  - `title`: VARCHAR(150) NOT NULL
  - `content`: TEXT NOT NULL
  - `type`: ENUM('standard', 'offer', 'urgency', 'custom') DEFAULT 'standard'
  - `status`: ENUM('active', 'inactive') DEFAULT 'active'
  - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

## Endpoints da API (Super Admin)
- `GET /api/sa/message-templates`: Lista os modelos mestres.
- `POST /api/sa/message-templates`: Cria um novo modelo mestre.
- `PUT /api/sa/message-templates/[id]`: Atualiza um modelo mestre existente.
- `DELETE /api/sa/message-templates/[id]`: Exclui permanentemente um modelo mestre.
- `PATCH /api/sa/message-templates/[id]/status`: Alterna o status ativo/inativo (define se participa do snapshot de novas empresas).
