-- Migration: Adicionar coluna offer_box_style na tabela company_products
ALTER TABLE company_products 
ADD COLUMN offer_box_style VARCHAR(50) NULL DEFAULT 'model_1' AFTER benefits_icon;
