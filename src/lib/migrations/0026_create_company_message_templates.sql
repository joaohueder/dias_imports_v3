-- 0026_create_company_message_templates.sql
-- Tabela para armazenar modelos de mensagens pré-configuradas para disparos no WhatsApp

CREATE TABLE IF NOT EXISTS company_message_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('product_offer', 'simple_text', 'welcome', 'reminder', 'custom') NOT NULL DEFAULT 'product_offer',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_msg_templates_company_id (company_id),
  INDEX idx_company_msg_templates_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
