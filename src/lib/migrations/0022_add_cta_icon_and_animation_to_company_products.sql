-- Migration: Adicionar colunas cta_icon e cta_animation na tabela company_products
ALTER TABLE company_products 
ADD COLUMN cta_icon VARCHAR(50) NULL DEFAULT 'arrow-right' AFTER cta_text,
ADD COLUMN cta_animation VARCHAR(50) NULL DEFAULT 'none' AFTER cta_icon;
