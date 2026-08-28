-- Migration: 0031_add_schedule_fields_to_workers.sql
-- Adiciona suporte a ativação individual de rotinas e agendamento de intervalo em minutos para workers de rotinas
-- Versão: 2026.08.0486

ALTER TABLE workers
  ADD COLUMN schedule_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER batch_pause_seconds,
  ADD COLUMN schedule_interval_minutes INT NOT NULL DEFAULT 5 AFTER schedule_enabled;

-- Ajusta valores iniciais coerentes
UPDATE workers SET schedule_enabled = 1, schedule_interval_minutes = 5 WHERE id = 'w-reports-01';
UPDATE workers SET schedule_enabled = 1, schedule_interval_minutes = 1440 WHERE id = 'w-cron-01';
UPDATE workers SET schedule_enabled = 1, schedule_interval_minutes = 0 WHERE id NOT IN ('w-reports-01', 'w-cron-01');
