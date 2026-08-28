-- Migration: 0032_reset_and_clear_all_workers_and_jobs.sql
-- Limpeza completa de workers, filas e background jobs existentes para recriação orientada pelo usuário
-- Versão: 2026.08.0487

DELETE FROM background_jobs;
DELETE FROM workers;
DELETE FROM queues;
