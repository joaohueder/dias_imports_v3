-- Migration: 0036_create_groups_sync_worker.sql
-- Registra o worker padrão para sincronização e atualização de grupos de WhatsApp com anti-ban

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
  'w-groups-01',
  'Atualização de Grupos WhatsApp',
  'Sincronização periódica e em lote de metadados, participantes e status de grupos com delay anti-ban randômico isolado por empresa',
  'schedule',
  'whatsapp-groups-sync',
  5,
  5,
  15,
  10,
  30,
  1,
  60,
  1,
  'active',
  0,
  0,
  0,
  NOW()
);
