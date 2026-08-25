-- Migration: 0005_create_plans_and_subscriptions_tables
-- Description: Criação das tabelas de planos e assinaturas separadas
-- Versão: 2026.08.0019

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  billing_cycle ENUM('monthly', 'quarterly', 'semiannual', 'yearly') NOT NULL DEFAULT 'monthly',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  max_groups INT NOT NULL DEFAULT 10,
  max_products INT NOT NULL DEFAULT 100,
  max_messages_day INT NOT NULL DEFAULT 1000,
  max_instances INT NOT NULL DEFAULT 1,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  features JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insere planos padrão caso tabela esteja vazia
INSERT IGNORE INTO plans (id, name, description, price, billing_cycle, status, max_groups, max_products, max_messages_day, max_instances, is_featured)
VALUES 
  (1, 'Iniciante', 'Ideal para pequenos lojistas e autônomos começando no WhatsApp.', 49.90, 'monthly', 'active', 5, 50, 500, 1, FALSE),
  (2, 'Profissional', 'Para empresas em crescimento que precisam de alto volume e catálogos maiores.', 99.90, 'monthly', 'active', 20, 500, 3000, 3, TRUE),
  (3, 'Enterprise', 'Para grandes operações e e-commerces com envio em massa e catálogos ilimitados.', 199.90, 'monthly', 'active', 100, 2000, 15000, 10, FALSE);

-- Tabela de Assinaturas (vinculando empresas aos planos)
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('active', 'trialing', 'past_due', 'canceled', 'expired') NOT NULL DEFAULT 'active',
  current_period_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_end DATETIME NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  payment_method VARCHAR(50) NULL DEFAULT 'pix',
  price_at_subscription DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
