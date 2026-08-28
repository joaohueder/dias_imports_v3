-- Migration: 0038_create_subscriptions_worker.sql
-- Registra o worker padrão para verificação de assinaturas e expirações

INSERT IGNORE INTO workers (
  id, 
  name, 
  description, 
  type, 
  queue_name, 
  concurrency, 
  min_delay_seconds, 
  max_delay_seconds, 
  batch_size, 
  batch_pause_seconds, 
  schedule_enabled, 
  schedule_interval_seconds, 
  schedule_interval_minutes, 
  status, 
  processed_count, 
  failed_count, 
  delayed_count, 
  created_at
) VALUES (
  'w-cron-01',
  'Worker Agendador e Rotinas Cron (Billing / Expirations)',
  'Rotinas agendadas para expiração de planos, notificações de vencimento e auditoria periódica.',
  'schedule',
  'cron-subscriptions',
  2,
  0,
  0,
  100,
  0,
  1,
  3600, -- 1 hora em segundos
  60,   -- 1 hora em minutos
  'active',
  0,
  0,
  0,
  NOW()
) ON DUPLICATE KEY UPDATE 
  type = 'schedule',
  schedule_enabled = 1,
  schedule_interval_seconds = 3600,
  schedule_interval_minutes = 60;