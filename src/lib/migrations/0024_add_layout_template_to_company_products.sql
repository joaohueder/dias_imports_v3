-- Migration 0024: Adiciona coluna layout_template na tabela company_products
ALTER TABLE company_products 
ADD COLUMN layout_template VARCHAR(50) NULL DEFAULT 'default' AFTER cover_image;
