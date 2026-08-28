# Documentação e Memória: Módulo de Instâncias WhatsApp (/sa/instances)

**Data:** 2026-08-27  
**Versão:** 2026.08.0483  
**Responsável Técnico:** JH7-DESENVOLVEDOR, JH7-DESIGNER, JH7-SECURITY-GUARDIAN, JH7-MESTRE-DOCUMENTACAO  

---

## 1. Visão Geral e Separação de Módulos

O ecossistema Super Admin separou explicitamente o gerenciamento de **Instâncias WhatsApp** (`/sa/instances`) do gerenciamento de **Workers & Background Jobs** (`/sa/workers`).

- **Instâncias WhatsApp (`/sa/instances`):** Responsável pelo controle de conexões com APIs/gateways de WhatsApp (Evolution API / Baileys / WPPConnect), controle de sockets, status de conexão (`connected`, `connecting`, `qrcode`, `disconnected`, `banned`), telemetria de mensagens enviadas e recebidas por tenant, vinculação direta a empresas e respeito estrito aos limites de instâncias contratados no plano/assinatura. Conta com barra de busca, filtros avançados por Empresa e Status e botão dinâmico de **Limpar Filtros** (na barra e no *empty state*).
- **Workers & Background Jobs (`/sa/workers`):** Focado no monitoramento de filas Redis/BullMQ, rotinas assíncronas, consumo de memória, concorrência e instâncias de processos em background.

---

## 2. Estrutura do Banco de Dados

### Tabela `instances` (Migration `0009_create_instances_table.sql`)
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `company_id`: INT NOT NULL (Chave estrangeira lógica indexada para `companies.id`)
- `name`: VARCHAR(150) NOT NULL (Identificador amigável da instância)
- `whatsapp_number`: VARCHAR(50) NULL
- `server_url`: VARCHAR(255) NULL
- `api_key`: VARCHAR(255) NULL
- `instance_key`: VARCHAR(255) NOT NULL UNIQUE
- `status`: ENUM('connected', 'connecting', 'disconnected', 'banned', 'qrcode') NOT NULL DEFAULT 'disconnected'
- `qrcode_base64`: LONGTEXT NULL
- `phone_connected`: VARCHAR(50) NULL
- `profile_name`: VARCHAR(150) NULL
- `profile_picture_url`: TEXT NULL
- `battery_level`: INT NULL
- `is_charging`: BOOLEAN NULL DEFAULT FALSE
- `total_messages_sent`: INT NOT NULL DEFAULT 0
- `total_messages_received`: INT NOT NULL DEFAULT 0
- `last_activity_at`: DATETIME NULL
- `created_at` / `updated_at`: TIMESTAMP

---

## 3. Endpoints de API Criados

- `GET /api/sa/instances` — Lista instâncias com suporte a filtros de busca textual (`name`, `instance_key`, `whatsapp_number`, `company_name`), status e empresa (`company_id`). Protegido por `requireSaPermission("instances", "view")`.
- `POST /api/sa/instances` — Cria nova instância com validação de cota máxima por empresa e geração de `instance_key` única. Protegido por `requireSaPermission("instances", "create")`.
- `GET /api/sa/instances/[id]` — Detalhes completos da instância. Protegido por `requireSaPermission("instances", "view")`.
- `PUT /api/sa/instances/[id]` — Atualização de parâmetros cadastrais da instância. Protegido por `requireSaPermission("instances", "edit")`.
- `DELETE /api/sa/instances/[id]` — Exclusão da instância. Protegido por `requireSaPermission("instances", "delete")`.
- `PATCH /api/sa/instances/[id]/action` — Executa ações de socket (`connect`, `disconnect`, `restart`, `set_status`). Protegido por `requireSaPermission("instances", "edit")`.

---

## 4. Interface e Experiência do Usuário (UI/UX)

- Padrão unificado de cabeçalho com `SaPageHeader` (`bg-indigo-600`, ícone giratório de atualização, badge roxo de infraestrutura).
- Cards KPI no topo para contagem instantânea de total, instâncias online, em conexão/QR e desconectadas.
- Grid de cards estilizados com design dark elegante, badges de status pulsantes, telemetria de mensagens e atalhos rápidos de ligar/desligar e reiniciar socket.
- Modais de criação/edição e modal obrigatório de confirmação de exclusão com segurança e feedback unificado.
