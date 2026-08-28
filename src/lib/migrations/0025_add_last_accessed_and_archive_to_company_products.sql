-- Migration 0025: Adiciona coluna last_accessed_at e is_archived na tabela company_products
ALTER TABLE company_products 
ADD COLUMN last_accessed_at TIMESTAMP NULL DEFAULT NULL AFTER clicks_count,
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE AFTER status;
