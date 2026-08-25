-- Migration: 0004_add_admin_whatsapp_and_otp_to_users_and_companies
-- Description: Adiciona campos de whatsapp_admin à tabela companies e whatsapp/otp à tabela users
-- Versão: 2026.08.0009

ALTER TABLE companies ADD COLUMN admin_whatsapp VARCHAR(50) NULL AFTER whatsapp;
ALTER TABLE companies ADD UNIQUE INDEX uq_companies_admin_whatsapp (admin_whatsapp);

ALTER TABLE users ADD COLUMN whatsapp VARCHAR(50) NULL AFTER email;
ALTER TABLE users ADD UNIQUE INDEX uq_users_whatsapp (whatsapp);
ALTER TABLE users ADD COLUMN otp_code VARCHAR(10) NULL AFTER password;
ALTER TABLE users ADD COLUMN otp_expires_at DATETIME NULL AFTER otp_code;
