-- 0027_update_company_message_templates_status.sql
-- Substitui a coluna is_default por status ENUM('active', 'inactive') DEFAULT 'active'

ALTER TABLE company_message_templates 
  ADD COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' AFTER type;

-- Preenche status baseado nos dados existentes se houver
UPDATE company_message_templates SET status = 'active';

-- Remove coluna is_default caso exista
ALTER TABLE company_message_templates DROP COLUMN is_default;
