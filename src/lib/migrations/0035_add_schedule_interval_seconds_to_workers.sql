-- Migration: Adiciona precisão em segundos para agendamento dos Workers
-- Versão: 2026.08.0492

ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS schedule_interval_seconds INT NOT NULL DEFAULT 30 AFTER schedule_enabled;

UPDATE workers 
SET schedule_interval_seconds = 15 
WHERE id = 'w-health-01';
