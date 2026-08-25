-- Migration: 0003_add_address_fields_to_companies
-- Description: Adiciona campos de endereço completos (CEP, logradouro, número, complemento, bairro) e campo whatsapp à tabela companies
-- Versão: 2026.08.0006

ALTER TABLE companies ADD COLUMN whatsapp VARCHAR(50) NULL AFTER phone;
ALTER TABLE companies ADD COLUMN address_zipcode VARCHAR(20) NULL AFTER address_state;
ALTER TABLE companies ADD COLUMN address_street VARCHAR(255) NULL AFTER address_zipcode;
ALTER TABLE companies ADD COLUMN address_number VARCHAR(50) NULL AFTER address_street;
ALTER TABLE companies ADD COLUMN address_complement VARCHAR(150) NULL AFTER address_number;
ALTER TABLE companies ADD COLUMN address_neighborhood VARCHAR(150) NULL AFTER address_complement;
