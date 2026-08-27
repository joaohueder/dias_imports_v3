-- Migration: Adicionar coluna benefits_icon na tabela company_products
ALTER TABLE company_products 
ADD COLUMN benefits_icon VARCHAR(50) NULL DEFAULT 'check' AFTER benefits;
