-- Migration: Adicionar coluna sends_count na tabela company_products
ALTER TABLE company_products 
ADD COLUMN sends_count INT NOT NULL DEFAULT 0 AFTER external_link;
