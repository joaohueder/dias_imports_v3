-- Migration: 0014_add_delay_and_batch_config_to_workers.sql
-- Configuração de anti-ban, intervalos randômicos e lotes por worker
-- Versão: 2026.08.0176

ALTER TABLE workers 
  ADD COLUMN min_delay_seconds INT NOT NULL DEFAULT 3 AFTER concurrency,
  ADD COLUMN max_delay_seconds INT NOT NULL DEFAULT 15 AFTER min_delay_seconds,
  ADD COLUMN batch_size INT NOT NULL DEFAULT 10 AFTER max_delay_seconds,
  ADD COLUMN batch_pause_seconds INT NOT NULL DEFAULT 30 AFTER batch_size;

-- Configurações padrão específicas para cada worker padrão
UPDATE workers SET min_delay_seconds = 3, max_delay_seconds = 15, batch_size = 20, batch_pause_seconds = 10 WHERE id = 'w-dispatch-01';
UPDATE workers SET min_delay_seconds = 5, max_delay_seconds = 30, batch_size = 10, batch_pause_seconds = 60 WHERE id = 'w-dispatch-02';
UPDATE workers SET min_delay_seconds = 1, max_delay_seconds = 3, batch_size = 50, batch_pause_seconds = 5 WHERE id = 'w-sync-01';
UPDATE workers SET min_delay_seconds = 5, max_delay_seconds = 10, batch_size = 5, batch_pause_seconds = 30 WHERE id = 'w-cron-01';
UPDATE workers SET min_delay_seconds = 2, max_delay_seconds = 5, batch_size = 25, batch_pause_seconds = 15 WHERE id = 'w-reports-01';
