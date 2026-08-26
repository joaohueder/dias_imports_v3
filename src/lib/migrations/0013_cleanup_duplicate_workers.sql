-- Migration: 0013_cleanup_duplicate_workers.sql
-- Limpeza e consolidação dos workers padrão do ecossistema
-- Versão: 2026.08.0175

DELETE FROM workers WHERE id IN ('w-cron-1', 'w-msg-default-1', 'w-msg-default-2', 'w-msg-high-1', 'w-webhook-1');
