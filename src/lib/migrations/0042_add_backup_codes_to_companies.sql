-- Migration: 0042_add_backup_codes_to_companies.sql
-- Description: Adiciona coluna para armazenar códigos de backup (reserva) para acesso ao painel da empresa
-- Versão: 2026.08.0609

ALTER TABLE companies ADD COLUMN backup_codes JSON NULL AFTER admin_whatsapp;
