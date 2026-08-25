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

export async function initAuthDatabase(): Promise<void> {
  const db = getDbPool();

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
      max_instances INT NOT NULL DEFAULT 1,
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
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

  // Insere o super admin padrão inicial se não existir
  await db.query(`
    INSERT IGNORE INTO users (name, email, password, role, status)
    VALUES ('João Hueder', 'joaohueder@gmail.com', '123456', 'SUPER_ADMIN', 'active');
  `);
}
