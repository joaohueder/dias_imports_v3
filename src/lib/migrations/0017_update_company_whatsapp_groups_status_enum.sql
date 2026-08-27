-- Migration: 0017_update_company_whatsapp_groups_status_enum
-- Description: Atualiza o ENUM de status de grupos do WhatsApp para conter apenas 'active' e 'paused'
-- Versão: 2026.08.0276

ALTER TABLE company_whatsapp_groups 
MODIFY COLUMN status ENUM('active', 'paused') NOT NULL DEFAULT 'active';
