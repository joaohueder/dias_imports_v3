-- Migration: 0002_create_companies_table
-- Description: Criação da tabela de empresas (tenants) para o módulo de Empresas do Super Admin
-- Versão: 2026.08.0005

CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255) NULL,
  document VARCHAR(30) NULL UNIQUE,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'Pro',
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  max_instances INT NOT NULL DEFAULT 5,
  max_messages_day INT NOT NULL DEFAULT 5000,
  logo_url TEXT NULL,
  address_city VARCHAR(100) NULL,
  address_state VARCHAR(10) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
