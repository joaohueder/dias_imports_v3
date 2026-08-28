-- Migration: 0037_create_messages_default_worker.sql
-- Registra o worker padrão para envio de mensagens em massa para grupos de WhatsApp com anti-ban

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
  'w-messages-01',
  'Envio de Mensagens em Massa',
  'Disparos em massa de campanhas para grupos de WhatsApp com delay anti-ban randômico isolado por empresa',
  'schedule',
  'whatsapp-messages-default',
  5,
  10,
  30,
  5,
  60,
  1,
  60,
  1,
  'active',
  0,
  0,
  0,
  NOW()
);