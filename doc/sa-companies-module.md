# Documentação & Memória: Módulo de Empresas Multi-Tenancy (/sa/companies)

**Data:** 2026-08-25  
**Versão:** 2026.08.0005  
**Responsável Técnico:** JH7-DESENVOLVEDOR, JH7-DESIGNER, JH7-MESTRE-DOCUMENTACAO, JH7-SECURITY-GUARDIAN  

---

## 1. Visão Geral do Módulo

O módulo **Empresas** no painel do Super Admin (`/sa/companies`) centraliza o gerenciamento completo dos clientes/tenants do ecossistema SaaS JH7 Marketing.

### Principais Recursos
1. **Listagem & Filtros Avançados:**
   - Pesquisa em tempo real por Razão Social, Nome Fantasia, CNPJ/CPF e E-mail corporativo.
   - Filtro por status (`active`, `inactive`, `suspended`).
   - Contadores em tempo real de instâncias liberadas, usuários vinculados e total de tenants ativos.

2. **Cadastro & Edição de Tenants:**
   - Criação e atualização de empresas com validação de duplicidade de documentos fiscais.
   - Definição de limites operacionais de WhatsApp: limite de instâncias simultâneas e limite diário de mensagens disparadas.
   - Associação de plano (`Starter`, `Pro`, `Enterprise`, `Custom`).

3. **Exclusão Segura com Modal de Confirmação:**
   - Modal com alerta de impacto nos usuários vinculados.
   - Desassociação automática (`UPDATE users SET company_id = NULL`) antes de remoção do registro para integridade relacional.

---

## 2. Estrutura do Banco de Dados & Migrations

- **Migration:** [src/lib/migrations/0002_create_companies_table.sql](../src/lib/migrations/0002_create_companies_table.sql)
- **Tabela:** `companies`
  - `id`: INT AUTO_INCREMENT PRIMARY KEY
  - `name`: VARCHAR(255) NOT NULL (Razão Social)
  - `trade_name`: VARCHAR(255) NULL (Nome Fantasia)
  - `document`: VARCHAR(30) NULL UNIQUE (CNPJ/CPF)
  - `email`: VARCHAR(255) NULL
  - `phone`: VARCHAR(50) NULL
  - `plan`: VARCHAR(50) NOT NULL DEFAULT 'Pro'
  - `status`: ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active'
  - `max_instances`: INT NOT NULL DEFAULT 5
  - `max_messages_day`: INT NOT NULL DEFAULT 5000
  - `address_city`: VARCHAR(100) NULL
  - `address_state`: VARCHAR(10) NULL
  - `created_at`, `updated_at`: TIMESTAMP

---

## 3. Endpoints REST da API

- `GET /api/sa/companies` — Lista empresas com contagem de usuários e filtros.
- `POST /api/sa/companies` — Cadastro de nova empresa com validação de documento.
- `GET /api/sa/companies/[id]` — Detalhes completos de uma empresa.
- `PUT /api/sa/companies/[id]` — Atualização de dados cadastrais e quotas.
- `DELETE /api/sa/companies/[id]` — Exclusão com desvinculação prévia.
