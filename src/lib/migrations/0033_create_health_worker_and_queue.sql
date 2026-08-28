-- Migration: 0033_create_health_worker_and_queue.sql
-- Cria a fila e o worker dedicado para Health & Telemetria do Sistema
-- Versão: 2026.08.0488

INSERT IGNORE INTO queues (id, name, description, is_paused) VALUES
('q-health-monitor', 'system-health-monitor', 'Monitoramento e consolidação de saúde, latência, CPU, memória e status dos serviços', 0);

INSERT IGNORE INTO workers (
  id, name, description, type, queue_name, concurrency, status,
  processed_count, failed_count, delayed_count, min_delay_seconds, max_delay_seconds,
  batch_size, batch_pause_seconds, schedule_enabled, schedule_interval_minutes,
  cpu_usage, memory_usage, uptime_seconds, last_heartbeat_at
) VALUES (
  'w-health-01',
  'Worker de Saúde & Telemetria do Sistema',
  'Executa rotinas periódicas de health-check, verificação de latência do banco MySQL, Redis, PM2, instâncias e telemetria do servidor.',
  'health',
  'system-health-monitor',
  1,
  'active',
  0,
  0,
  0,
  1,
  5,
  1,
  0,
  1,
  1,
  '0.1%',
  '32 MB',
  0,
  NOW()
);
