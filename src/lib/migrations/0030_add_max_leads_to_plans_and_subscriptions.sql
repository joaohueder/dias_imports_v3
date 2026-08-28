-- Migration: 0030_add_max_leads_to_plans_and_subscriptions.sql
-- Description: Adiciona coluna de limite de leads em planos e snapshot em assinaturas
-- Versão: 2026.08.0445

ALTER TABLE plans ADD COLUMN max_leads INT NOT NULL DEFAULT 0 AFTER max_views;
ALTER TABLE subscriptions ADD COLUMN plan_snapshot_max_leads INT NULL DEFAULT 0 AFTER plan_snapshot_max_views;

UPDATE subscriptions s
JOIN plans p ON s.plan_id = p.id
SET s.plan_snapshot_max_leads = p.max_leads
WHERE s.plan_snapshot_max_leads = 0 OR s.plan_snapshot_max_leads IS NULL;
