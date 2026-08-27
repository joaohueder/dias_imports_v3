-- Migration: 0016_create_company_whatsapp_groups_table
-- Description: Criação da tabela de grupos de WhatsApp para o módulo de marketing do painel da empresa
-- Versão: 2026.08.0275

CREATE TABLE IF NOT EXISTS company_whatsapp_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  whatsapp_group_id VARCHAR(100) NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  group_type VARCHAR(50) NOT NULL DEFAULT 'offers',
  can_send_messages ENUM('all', 'admin_only') NOT NULL DEFAULT 'admin_only',
  participants_count INT NOT NULL DEFAULT 0,
  max_capacity INT NOT NULL DEFAULT 1024,
  invite_link VARCHAR(255) NULL,
  avatar_url TEXT NULL,
  tags JSON NULL,
  is_admin BOOLEAN NOT NULL DEFAULT TRUE,
  instance_id VARCHAR(100) NULL,
  status ENUM('active', 'paused') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_groups_company_id (company_id),
  INDEX idx_groups_whatsapp_id (whatsapp_group_id),
  INDEX idx_groups_status (status),
  INDEX idx_groups_type (group_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
