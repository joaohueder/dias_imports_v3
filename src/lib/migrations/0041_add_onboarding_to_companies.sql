-- Migration: 0041_add_onboarding_to_companies.sql
-- Description: Adiciona colunas de controle de onboarding/wizard para a empresa
-- Versão: 2026.08.0567

ALTER TABLE companies ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE AFTER address_state;
ALTER TABLE companies ADD COLUMN onboarding_current_step INT NOT NULL DEFAULT 1 AFTER onboarding_completed;
ALTER TABLE companies ADD COLUMN onboarding_completed_steps JSON NULL AFTER onboarding_current_step;
