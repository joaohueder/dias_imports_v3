-- Migration: 0006_add_sort_order_to_plans
-- Description: Adiciona coluna sort_order na tabela de planos para ordenação personalizada via drag and drop
-- Versão: 2026.08.0023

ALTER TABLE plans ADD COLUMN sort_order INT NOT NULL DEFAULT 0;

-- Atualiza a ordenação inicial baseando-se no id
UPDATE plans SET sort_order = id WHERE sort_order = 0;
