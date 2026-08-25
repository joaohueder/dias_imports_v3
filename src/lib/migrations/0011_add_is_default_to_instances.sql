-- Migration: 0011_add_is_default_to_instances
-- Description: Adiciona coluna is_default para identificar a instância padrão do sistema/SaaS
-- Versão: 2026.08.0143

ALTER TABLE instances ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE AFTER is_charging;
ALTER TABLE instances ADD INDEX idx_is_default (is_default);
