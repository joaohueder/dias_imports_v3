-- Migration: 0034_create_health_snapshots_table.sql
-- Tabela para armazenar o snapshot de saúde gerado pelo Worker de Saúde
-- Versão: 2026.08.0489

CREATE TABLE IF NOT EXISTS system_health_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status VARCHAR(32) NOT NULL DEFAULT 'healthy',
  db_status VARCHAR(32) NOT NULL DEFAULT 'online',
  db_latency_ms INT NOT NULL DEFAULT 0,
  redis_status VARCHAR(32) NOT NULL DEFAULT 'online',
  redis_latency_ms INT NOT NULL DEFAULT 0,
  pm2_status VARCHAR(32) NOT NULL DEFAULT 'online',
  evolution_status VARCHAR(32) NOT NULL DEFAULT 'online',
  whatsapp_status VARCHAR(32) NOT NULL DEFAULT 'disconnected',
  whatsapp_phone VARCHAR(64) NULL,
  whatsapp_profile VARCHAR(255) NULL,
  system_cpu_usage VARCHAR(32) NOT NULL DEFAULT '0.0%',
  system_total_mem_mb INT NOT NULL DEFAULT 0,
  system_used_mem_mb INT NOT NULL DEFAULT 0,
  system_uptime_seconds INT NOT NULL DEFAULT 0,
  raw_payload JSON NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cria o registro único inicial
INSERT IGNORE INTO system_health_snapshots (id, status, db_status, redis_status, pm2_status, evolution_status, whatsapp_status, updated_at)
VALUES (1, 'healthy', 'online', 'online', 'online', 'online', 'connected', NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();
