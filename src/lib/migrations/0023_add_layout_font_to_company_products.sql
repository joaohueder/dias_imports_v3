-- Migration 0023: Adiciona coluna layout_font na tabela company_products
ALTER TABLE company_products 
ADD COLUMN layout_font VARCHAR(50) NULL DEFAULT 'sans_modern' AFTER layout_theme;
