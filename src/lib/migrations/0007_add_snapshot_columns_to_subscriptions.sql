-- Migration: 0007_add_snapshot_columns_to_subscriptions
-- Description: Adiciona colunas de snapshot do plano contratado na tabela subscriptions
-- Versão: 2026.08.0027

ALTER TABLE subscriptions ADD COLUMN plan_snapshot_name VARCHAR(100) NULL AFTER plan_id;
ALTER TABLE subscriptions ADD COLUMN plan_snapshot_max_groups INT NULL DEFAULT 0 AFTER plan_snapshot_name;
ALTER TABLE subscriptions ADD COLUMN plan_snapshot_max_products INT NULL DEFAULT 0 AFTER plan_snapshot_max_groups;
ALTER TABLE subscriptions ADD COLUMN plan_snapshot_max_messages_day INT NULL DEFAULT 0 AFTER plan_snapshot_max_products;
ALTER TABLE subscriptions ADD COLUMN plan_snapshot_max_instances INT NULL DEFAULT 1 AFTER plan_snapshot_max_messages_day;
ALTER TABLE subscriptions ADD COLUMN plan_snapshot_billing_cycle VARCHAR(50) NULL DEFAULT 'monthly' AFTER plan_snapshot_max_instances;
ALTER TABLE subscriptions ADD COLUMN plan_snapshot_features JSON NULL AFTER plan_snapshot_billing_cycle;

-- Popula o snapshot das assinaturas pré-existentes a partir da tabela de planos
UPDATE subscriptions s
JOIN plans p ON s.plan_id = p.id
SET 
  s.plan_snapshot_name = p.name,
  s.plan_snapshot_max_groups = p.max_groups,
  s.plan_snapshot_max_products = p.max_products,
  s.plan_snapshot_max_messages_day = p.max_messages_day,
  s.plan_snapshot_max_instances = p.max_instances,
  s.plan_snapshot_billing_cycle = p.billing_cycle,
  s.plan_snapshot_features = p.features
WHERE s.plan_snapshot_name IS NULL;
