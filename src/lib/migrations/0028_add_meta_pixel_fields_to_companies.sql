-- Migration 0028: Adiciona colunas para Meta Ads Pixel e API de Conversões na tabela companies
-- Versão: 2026.08.0426

ALTER TABLE companies
ADD COLUMN meta_pixel_id VARCHAR(50) NULL AFTER logo_url,
ADD COLUMN meta_pixel_access_token TEXT NULL AFTER meta_pixel_id,
ADD COLUMN meta_pixel_test_code VARCHAR(50) NULL AFTER meta_pixel_access_token,
ADD COLUMN meta_pixel_active BOOLEAN NOT NULL DEFAULT FALSE AFTER meta_pixel_test_code;
