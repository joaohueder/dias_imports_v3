-- Migration: 0029_create_company_group_landing_pages_and_leads.sql
-- Description: Criação das tabelas para Landing Page de Grupos VIP e Captura de Leads
-- Versão: 2026.08.0433

CREATE TABLE IF NOT EXISTS company_group_landing_pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Grupo VIP Exclusivo',
  headline VARCHAR(255) NOT NULL DEFAULT 'Receba ofertas secretas e novidades em primeira mão!',
  subheadline TEXT NULL,
  slug VARCHAR(255) NOT NULL,
  badge_text VARCHAR(100) NULL DEFAULT '⚡ VAGAS LIMITADAS',
  group_id INT NULL,
  invite_link TEXT NOT NULL,
  cover_image TEXT NULL,
  logo_url TEXT NULL,
  layout_color VARCHAR(50) NOT NULL DEFAULT '#6366f1',
  layout_theme VARCHAR(50) NOT NULL DEFAULT 'dark',
  layout_font VARCHAR(50) NOT NULL DEFAULT 'plusjakarta_inter',
  form_button_text VARCHAR(100) NOT NULL DEFAULT 'Entrar no Grupo VIP Grátis',
  benefits JSON NULL,
  testimonials JSON NULL,
  social_proof_count INT NOT NULL DEFAULT 847,
  modal_title VARCHAR(255) NOT NULL DEFAULT 'Tudo pronto! 🎉',
  modal_description TEXT NULL,
  modal_button_text VARCHAR(100) NOT NULL DEFAULT 'Acessar Grupo VIP no WhatsApp',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  views_count INT NOT NULL DEFAULT 0,
  leads_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_landing_company_id (company_id),
  INDEX idx_landing_slug (company_id, slug),
  INDEX idx_landing_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS company_leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  landing_page_id INT NULL,
  name VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  ip_address VARCHAR(100) NULL,
  user_agent TEXT NULL,
  origin_slug VARCHAR(255) NULL,
  status ENUM('converted', 'pending') NOT NULL DEFAULT 'converted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_leads_company_id (company_id),
  INDEX idx_leads_landing_id (landing_page_id),
  INDEX idx_leads_whatsapp (whatsapp),
  INDEX idx_leads_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
