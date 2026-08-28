import mysql, { Pool } from "mysql2/promise";

let pool: Pool | null = null;

export function getDatabaseUrl(): string {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "jh7_marketing";

  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function getDbPool(): Pool {
  if (!pool) {
    const host = process.env.DB_HOST || "localhost";
    const port = Number(process.env.DB_PORT) || 3306;
    const user = process.env.DB_USER || "root";
    const password = process.env.DB_PASSWORD || "";
    const database = process.env.DB_NAME || "jh7_marketing";

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    });
  }

  return pool;
}

let authDbInitialized = false;

export async function initAuthDatabase(): Promise<void> {
  if (authDbInitialized) return;
  const db = getDbPool();

  try {
    await db.query(`ALTER TABLE plans ADD COLUMN max_views INT NOT NULL DEFAULT 0 AFTER max_messages_day`);
  } catch {}
  try {
    await db.query(`ALTER TABLE plans ADD COLUMN max_leads INT NOT NULL DEFAULT 0 AFTER max_views`);
  } catch {}
  try {
    await db.query(`ALTER TABLE subscriptions ADD COLUMN plan_snapshot_max_views INT NULL DEFAULT 0 AFTER plan_snapshot_max_messages_day`);
  } catch {}
  try {
    await db.query(`ALTER TABLE subscriptions ADD COLUMN plan_snapshot_max_leads INT NULL DEFAULT 0 AFTER plan_snapshot_max_views`);
  } catch {}

  // Cria tabela de empresas se não existir
  await db.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      trade_name VARCHAR(255) NULL,
      document VARCHAR(30) NULL UNIQUE,
      email VARCHAR(255) NULL,
      phone VARCHAR(50) NULL,
      whatsapp VARCHAR(50) NULL,
      admin_whatsapp VARCHAR(50) NULL UNIQUE,
      plan VARCHAR(50) NOT NULL DEFAULT 'Pro',
      status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
      max_instances INT NOT NULL DEFAULT 5,
      max_messages_day INT NOT NULL DEFAULT 5000,
      logo_url TEXT NULL,
      meta_pixel_id VARCHAR(50) NULL,
      meta_pixel_access_token TEXT NULL,
      meta_pixel_test_code VARCHAR(50) NULL,
      meta_pixel_active BOOLEAN NOT NULL DEFAULT FALSE,
      address_zipcode VARCHAR(20) NULL,
      address_street VARCHAR(255) NULL,
      address_number VARCHAR(50) NULL,
      address_complement VARCHAR(150) NULL,
      address_neighborhood VARCHAR(150) NULL,
      address_city VARCHAR(100) NULL,
      address_state VARCHAR(10) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Cria tabela de usuários se não existir
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      whatsapp VARCHAR(50) NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      otp_code VARCHAR(10) NULL,
      otp_expires_at DATETIME NULL,
      role ENUM('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'USER') NOT NULL DEFAULT 'ADMIN',
      permissions JSON NULL,
      company_id INT NULL,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Cria tabela de planos se não existir
  await db.query(`
    CREATE TABLE IF NOT EXISTS plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT NULL,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      billing_cycle ENUM('monthly', 'quarterly', 'semiannual', 'yearly') NOT NULL DEFAULT 'monthly',
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      max_groups INT NOT NULL DEFAULT 10,
      max_products INT NOT NULL DEFAULT 100,
      max_messages_day INT NOT NULL DEFAULT 1000,
      max_views INT NOT NULL DEFAULT 0,
      max_leads INT NOT NULL DEFAULT 0,
      max_instances INT NOT NULL DEFAULT 1,
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      is_public BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INT NOT NULL DEFAULT 0,
      features JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Cria tabela de assinaturas se não existir
  await db.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      plan_id INT NOT NULL,
      plan_snapshot_name VARCHAR(100) NULL,
      plan_snapshot_max_groups INT NULL DEFAULT 0,
      plan_snapshot_max_products INT NULL DEFAULT 0,
      plan_snapshot_max_messages_day INT NULL DEFAULT 0,
      plan_snapshot_max_views INT NULL DEFAULT 0,
      plan_snapshot_max_leads INT NULL DEFAULT 0,
      plan_snapshot_max_instances INT NULL DEFAULT 1,
      plan_snapshot_billing_cycle VARCHAR(50) NULL DEFAULT 'monthly',
      plan_snapshot_features JSON NULL,
      status ENUM('active', 'trialing', 'past_due', 'canceled', 'expired') NOT NULL DEFAULT 'active',
      current_period_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      current_period_end DATETIME NOT NULL,
      cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
      payment_method VARCHAR(50) NULL DEFAULT 'pix',
      price_at_subscription DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Cria tabela de instâncias se não existir
  await db.query(`
    CREATE TABLE IF NOT EXISTS instances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      whatsapp_number VARCHAR(50) NULL,
      server_url VARCHAR(255) NULL,
      api_key VARCHAR(255) NULL,
      instance_key VARCHAR(255) NOT NULL UNIQUE,
      status ENUM('connected', 'connecting', 'disconnected', 'banned', 'qrcode') NOT NULL DEFAULT 'disconnected',
      qrcode_base64 LONGTEXT NULL,
      phone_connected VARCHAR(50) NULL,
      profile_name VARCHAR(150) NULL,
      profile_picture_url TEXT NULL,
      battery_level INT NULL,
      is_charging BOOLEAN NULL DEFAULT FALSE,
      total_messages_sent INT NOT NULL DEFAULT 0,
      total_messages_received INT NOT NULL DEFAULT 0,
      last_activity_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_company_id (company_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Cria tabela de produtos do catálogo da empresa se não existir
  await db.query(`
    CREATE TABLE IF NOT EXISTS company_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      description TEXT NULL,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      promo_price DECIMAL(10, 2) NULL,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      images JSON NULL,
      cover_image TEXT NULL,
      whatsapp_destination VARCHAR(50) NULL DEFAULT 'default',
      meta_ads_active BOOLEAN NOT NULL DEFAULT FALSE,
      layout_color VARCHAR(50) NULL DEFAULT '#6366f1',
      layout_theme VARCHAR(50) NULL DEFAULT 'dark',
      layout_font VARCHAR(50) NULL DEFAULT 'sans_modern',
      cta_text VARCHAR(100) NULL DEFAULT 'Comprar no WhatsApp',
      cta_icon VARCHAR(50) NULL DEFAULT 'arrow-right',
      cta_animation VARCHAR(50) NULL DEFAULT 'none',
      headline VARCHAR(255) NULL,
      guarantee_text VARCHAR(255) NULL,
      benefits JSON NULL,
      benefits_icon VARCHAR(50) NULL DEFAULT 'check',
      offer_box_style VARCHAR(50) NULL DEFAULT 'model_1',
      external_link TEXT NULL,
      sends_count INT NOT NULL DEFAULT 0,
      views_count INT NOT NULL DEFAULT 0,
      clicks_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_company_products_company (company_id),
      INDEX idx_company_products_slug (company_id, slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Garante a coluna sends_count se a tabela já existia antes
  try {
    await db.query(`
      ALTER TABLE company_products 
      ADD COLUMN sends_count INT NOT NULL DEFAULT 0 AFTER external_link;
    `);
  } catch {
    // Coluna já existente
  }

  // Garante a coluna benefits_icon se a tabela já existia antes
  try {
    await db.query(`
      ALTER TABLE company_products 
      ADD COLUMN benefits_icon VARCHAR(50) NULL DEFAULT 'check' AFTER benefits;
    `);
  } catch {
    // Coluna já existente
  }

  // Garante a coluna offer_box_style se a tabela já existia antes
  try {
    await db.query(`
      ALTER TABLE company_products 
      ADD COLUMN offer_box_style VARCHAR(50) NULL DEFAULT 'model_1' AFTER benefits_icon;
    `);
  } catch {
    // Coluna já existente
  }

  // Garante as colunas cta_icon e cta_animation se a tabela já existia antes
  try {
    await db.query(`
      ALTER TABLE company_products 
      ADD COLUMN cta_icon VARCHAR(50) NULL DEFAULT 'arrow-right' AFTER cta_text,
      ADD COLUMN cta_animation VARCHAR(50) NULL DEFAULT 'none' AFTER cta_icon;
    `);
  } catch {
    // Coluna já existente
  }

  // Garante a coluna layout_template se a tabela já existia antes
  try {
    await db.query(`
      ALTER TABLE company_products 
      ADD COLUMN layout_template VARCHAR(50) NULL DEFAULT 'default' AFTER cover_image;
    `);
  } catch {
    // Coluna já existente
  }

  // Garante a coluna layout_font se a tabela já existia antes
  try {
    await db.query(`
      ALTER TABLE company_products 
      ADD COLUMN layout_font VARCHAR(50) NULL DEFAULT 'sans_modern' AFTER layout_theme;
    `);
  } catch {
    // Coluna já existente
  }

  // Garante as colunas last_accessed_at e is_archived se a tabela já existia antes
  try {
    await db.query(`
      ALTER TABLE company_products 
      ADD COLUMN last_accessed_at TIMESTAMP NULL DEFAULT NULL AFTER clicks_count,
      ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE AFTER status;
    `);
  } catch {
    // Colunas já existentes
  }

  // Garante colunas de Meta Ads Pixel e Onboarding na tabela companies se já existia
  try {
    await db.query(`
      ALTER TABLE companies 
      ADD COLUMN meta_pixel_id VARCHAR(50) NULL AFTER logo_url,
      ADD COLUMN meta_pixel_access_token TEXT NULL AFTER meta_pixel_id,
      ADD COLUMN meta_pixel_test_code VARCHAR(50) NULL AFTER meta_pixel_access_token,
      ADD COLUMN meta_pixel_active BOOLEAN NOT NULL DEFAULT FALSE AFTER meta_pixel_test_code;
    `);
  } catch {
    // Colunas já existentes
  }

  // Garante colunas de onboarding na tabela companies se já existia
  try {
    await db.query(`
      ALTER TABLE companies 
      ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE AFTER address_state,
      ADD COLUMN onboarding_current_step INT NOT NULL DEFAULT 1 AFTER onboarding_completed,
      ADD COLUMN onboarding_completed_steps JSON NULL AFTER onboarding_current_step;
    `);
  } catch {
    // Colunas já existentes
  }

  // Garante a coluna is_public na tabela plans se já existia
  try {
    await db.query(`
      ALTER TABLE plans 
      ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT TRUE AFTER is_featured;
    `);
  } catch {
    // Coluna já existente
  }

  // Garante colunas adicionais em company_group_landing_pages se já existia
  try {
    await db.query(`
      ALTER TABLE company_group_landing_pages 
      ADD COLUMN testimonials_enabled BOOLEAN NOT NULL DEFAULT TRUE AFTER testimonials;
    `);
  } catch {
    // Coluna já existente
  }

  // Garante tabelas de landing pages de grupo e leads da empresa
  await db.query(`
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
      testimonials_enabled BOOLEAN NOT NULL DEFAULT TRUE,
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
  `);

  await db.query(`
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
  `);

  // Garante colunas de OTP e WhatsApp na tabela users se já existia
  try {
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN whatsapp VARCHAR(50) NULL AFTER email,
      ADD COLUMN otp_code VARCHAR(10) NULL AFTER password,
      ADD COLUMN otp_expires_at DATETIME NULL AFTER otp_code;
    `);
  } catch {}

  // Garante coluna admin_whatsapp na tabela companies se já existia
  try {
    await db.query(`
      ALTER TABLE companies 
      ADD COLUMN admin_whatsapp VARCHAR(50) NULL AFTER whatsapp;
    `);
  } catch {}

  // Garante tabelas de background_jobs, workers e queues se não existirem
  await db.query(`
    CREATE TABLE IF NOT EXISTS background_jobs (
      id VARCHAR(64) PRIMARY KEY,
      queue_name VARCHAR(128) NOT NULL,
      name VARCHAR(128) NOT NULL,
      payload JSON NULL,
      status ENUM('waiting', 'active', 'completed', 'failed', 'delayed') NOT NULL DEFAULT 'waiting',
      attempts INT NOT NULL DEFAULT 0,
      max_attempts INT NOT NULL DEFAULT 3,
      failed_reason TEXT NULL,
      duration_ms INT NULL,
      processed_at DATETIME NULL,
      finished_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_queue_status (queue_name, status),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Insere o super admin padrão inicial se não existir
  await db.query(`
    INSERT IGNORE INTO users (name, email, password, role, status)
    VALUES ('João Hueder', 'joaohueder@gmail.com', '123456', 'SUPER_ADMIN', 'active');
  `);

  authDbInitialized = true;
}
