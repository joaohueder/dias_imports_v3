-- Migration: 0012_create_workers_and_jobs_tables.sql
-- Governança de Workers e Central de Tarefas Assíncronas

CREATE TABLE IF NOT EXISTS workers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  type VARCHAR(64) NOT NULL DEFAULT 'dispatcher',
  queue_name VARCHAR(128) NOT NULL,
  concurrency INT NOT NULL DEFAULT 1,
  status ENUM('active', 'idle', 'paused', 'stopped') NOT NULL DEFAULT 'idle',
  processed_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  delayed_count INT NOT NULL DEFAULT 0,
  cpu_usage VARCHAR(32) NOT NULL DEFAULT '0.0%',
  memory_usage VARCHAR(32) NOT NULL DEFAULT '0 MB',
  uptime_seconds INT NOT NULL DEFAULT 0,
  last_heartbeat_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS queues (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL UNIQUE,
  description TEXT NULL,
  is_paused TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS background_jobs (
  id VARCHAR(64) PRIMARY KEY,
  queue_name VARCHAR(128) NOT NULL,
  name VARCHAR(128) NOT NULL,
  payload JSON NULL,
  status ENUM('waiting', 'active', 'completed', 'failed', 'delayed') NOT NULL DEFAULT 'waiting',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  failed_reason TEXT NULL,
  duration_ms INT NULL,
  processed_at DATETIME NULL,
  finished_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_queue_status (queue_name, status),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seeds das filas padrão do ecossistema
INSERT IGNORE INTO queues (id, name, description, is_paused) VALUES
('q-messages-high', 'whatsapp-messages-high', 'Envio de OTP, autenticação e notificações críticas prioritárias', 0),
('q-messages-default', 'whatsapp-messages-default', 'Disparos em massa de campanhas para grupos de WhatsApp com delay anti-ban', 0),
('q-webhook-sync', 'evolution-webhook-sync', 'Sincronização de webhooks da Evolution API v2.3.7 e status de entrega', 0),
('q-cron-subscriptions', 'cron-subscriptions', 'Rotinas periódicas de verificação de assinaturas e expirações', 0),
('q-analytics', 'analytics-aggregation', 'Agregação analítica e consolidação de métricas do sistema', 0);

-- Seeds dos workers padrão do ecossistema
INSERT IGNORE INTO workers (id, name, description, type, queue_name, concurrency, status, processed_count, failed_count, delayed_count, cpu_usage, memory_usage, uptime_seconds, last_heartbeat_at) VALUES
('w-dispatch-01', 'Worker Disparador WhatsApp #01', 'Envio prioritário de códigos OTP, autenticação em duas etapas e alertas críticos imediatos.', 'dispatcher', 'whatsapp-messages-high', 5, 'active', 0, 0, 0, '0.4%', '42 MB', 120, NOW()),
('w-dispatch-02', 'Worker Disparador WhatsApp #02', 'Disparos em massa de campanhas para grupos de WhatsApp com cadência e delay anti-ban.', 'dispatcher', 'whatsapp-messages-default', 10, 'active', 0, 0, 0, '0.8%', '56 MB', 120, NOW()),
('w-sync-01', 'Worker Sincronizador de Contatos e Grupos', 'Consumo de webhooks da Evolution API, atualização de participantes e confirmação de entrega.', 'sync', 'evolution-webhook-sync', 4, 'active', 0, 0, 0, '0.3%', '38 MB', 120, NOW()),
('w-cron-01', 'Worker Agendador e Rotinas Cron (Billing / Expirations)', 'Rotinas agendadas para expiração de planos, notificações de vencimento e auditoria periódica.', 'scheduler', 'cron-subscriptions', 2, 'idle', 0, 0, 0, '0.1%', '32 MB', 120, NOW()),
('w-reports-01', 'Worker de Relatórios & Métricas', 'Agregação de dados analíticos, consolidação de métricas e relatórios do painel.', 'reports', 'analytics-aggregation', 2, 'paused', 0, 0, 0, '0.0%', '28 MB', 0, NOW());
