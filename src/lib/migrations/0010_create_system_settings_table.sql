-- Migration: 0010_create_system_settings_table
-- Description: Tabela de parâmetros e configurações globais do SaaS (layout, temas, etc.)
-- Versão: 2026.08.0117

CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value LONGTEXT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'layout',
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insere valores iniciais padrões caso não existam
INSERT IGNORE INTO system_settings (setting_key, setting_value, category, description) VALUES
('layout_max_width_preset', '1200px', 'layout', 'Preset de largura máxima do container principal (1200px, 1440px, full, custom)'),
('layout_max_width_custom', '1200', 'layout', 'Valor numérico customizado em pixels quando preset for custom (mínimo 1200px)');
