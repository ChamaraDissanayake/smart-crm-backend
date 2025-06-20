// src/config/db.config.js

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

const initDB = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password VARCHAR(255),
        provider ENUM('email', 'google') DEFAULT 'email',
        google_id VARCHAR(255) UNIQUE,
        is_verified BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        industry TINYINT UNSIGNED NOT NULL,
        location VARCHAR(255),
        size TINYINT UNSIGNED NOT NULL,
        chatbot_instruction TEXT,
        plan_id VARCHAR(50) NOT NULL DEFAULT 'free',
        is_active BOOLEAN DEFAULT TRUE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS company_members (
        user_id VARCHAR(36) NOT NULL,
        company_id VARCHAR(36) NOT NULL,
        role ENUM('admin', 'manager', 'member') NOT NULL DEFAULT 'member',
        is_deleted BOOLEAN DEFAULT FALSE,
        is_default BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, company_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS files (
        id VARCHAR(36) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        path VARCHAR(512) NOT NULL,
        content_hash VARCHAR(64) UNIQUE,
        size BIGINT,
        mime_type VARCHAR(36) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id CHAR(36) PRIMARY KEY, -- UUID
        company_id CHAR(36) NOT NULL,

        name TEXT,
        code VARCHAR(5),
        phone TEXT,
        email TEXT,
        location TEXT,
        is_company BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );
    `)

    await conn.query(`
      CREATE TABLE IF NOT EXISTS chat_threads (
        id VARCHAR(36) PRIMARY KEY,
        company_id VARCHAR(36) NOT NULL,
        customer_id VARCHAR(36) NOT NULL, -- FK to customers
        channel ENUM('whatsapp', 'messenger', 'tiktok', 'instagram', 'web') DEFAULT 'whatsapp',

        current_handler ENUM('bot', 'agent') DEFAULT 'bot',
        assigned_agent_id VARCHAR(36), -- Nullable

        is_active BOOLEAN DEFAULT TRUE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        handover_to_agent_at TIMESTAMP,
        handover_to_bot_at TIMESTAMP,
        closed_at TIMESTAMP,

        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(36) NOT NULL,
        thread_id VARCHAR(36) NOT NULL,
        role ENUM('user','assistant') NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price_monthly DECIMAL(10,2) NOT NULL,
        price_yearly DECIMAL(10,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await conn.query(`
      INSERT INTO subscriptions (id, name, price_monthly, price_yearly, description)
      VALUES 
        ('free', 'Free Trial', 0, 0, 'Get started with essential features for a limited time.'),
        ('basic', 'Basic', 9, 90, 'Perfect for small teams and early-stage businesses.'),
        ('standard', 'Standard', 19, 190, 'Ideal for growing teams needing more automation.'),
        ('premium', 'Premium', 29, 290, 'Advanced tools for large-scale teams and enterprises.')
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        price_monthly = VALUES(price_monthly),
        price_yearly = VALUES(price_yearly),
        description = VALUES(description);
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS company_subscriptions (
        id VARCHAR(36) PRIMARY KEY,
        company_id VARCHAR(36) NOT NULL,
        plan_id VARCHAR(50) NOT NULL,
        billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        renewal_date DATETIME,
        auto_renew BOOLEAN DEFAULT TRUE,
        status ENUM('active', 'canceled', 'expired', 'pending') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES subscriptions(id)
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS subscription_invoices (
        id VARCHAR(36) PRIMARY KEY,
        subscription_id VARCHAR(36) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status ENUM('paid', 'pending', 'failed') DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        invoice_date DATETIME NOT NULL,
        due_date DATETIME NOT NULL,
        paid_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subscription_id) REFERENCES company_subscriptions(id) ON DELETE CASCADE
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS facebook_integrations (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        access_token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_integrations (
        id VARCHAR(36) PRIMARY KEY,
        company_id VARCHAR(36) NOT NULL,
        access_token TEXT NOT NULL,
        whatsapp_business_account_id VARCHAR(255) NOT NULL,
        phone_number_id VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        business_name VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_phone_number_id (phone_number_id)
      );
    `);

  } finally {
    conn.release();
  }
};

module.exports = {
  initDB,
  pool
};
