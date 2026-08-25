-- Migration: 0008_add_permissions_and_system_role_to_users
-- Description: Adiciona coluna permissions e suporte a papéis do sistema SaaS (SUPER_ADMIN, ADMIN)
-- Versão: 2026.08.0064

ALTER TABLE users 
  ADD COLUMN permissions JSON NULL AFTER role;

-- Atualizar o ENUM da coluna role para suportar explicitamente ADMIN além de SUPER_ADMIN, COMPANY_ADMIN, USER
ALTER TABLE users 
  MODIFY COLUMN role ENUM('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'USER') NOT NULL DEFAULT 'ADMIN';
