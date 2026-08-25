-- Migration: 0009_create_instances_table
-- Description: Criação da tabela de instâncias WhatsApp integradas ao ecossistema SaaS
-- Versão: 2026.08.0082

CREATE TABLE IF NOT EXISTS instances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  whatsapp_number VARCHAR(50) NULL,
  server_url VARCHAR(255) NULL,
  api_key VARCHAR(255) NULL,
  instance_key VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('connected', 'connecting', 'disconnected', 'banned', 'qrcode') NOT NULL DEFAULT 'disconnected',
  qrcode_base64 LONGTEXT NULL,
  phone_connected VARCHAR(50) NULL,
  profile_name VARCHAR(150) NULL,
  profile_picture_url TEXT NULL,
  battery_level INT NULL,
  is_charging BOOLEAN NULL DEFAULT FALSE,
  total_messages_sent INT NOT NULL DEFAULT 0,
  total_messages_received INT NOT NULL DEFAULT 0,
  last_activity_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_id (company_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
