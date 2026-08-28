-- Migration: 0039_add_is_public_to_plans.sql
-- Description: Adiciona coluna is_public na tabela plans para controlar visibilidade no painel do lojista

ALTER TABLE plans ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT TRUE AFTER is_featured;
