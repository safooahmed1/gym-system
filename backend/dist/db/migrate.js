"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = __importDefault(require("pg"));
const env_js_1 = require("../config/env.js");
const schema = __importStar(require("./schema.js"));
const { Pool } = pg_1.default;
const pool = new Pool({
    connectionString: env_js_1.env.DATABASE_URL,
});
const db = (0, node_postgres_1.drizzle)(pool, { schema });
async function migrate() {
    console.log('Running migrations...');
    // Create tables in order
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'reception' CHECK (role IN ('admin', 'reception')),
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      account_id VARCHAR(5) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      national_id VARCHAR(14) NOT NULL UNIQUE,
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'expiring_soon')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP
    );
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      duration_months INTEGER NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'expiring_soon')),
      discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
      discount_value NUMERIC(10,2),
      final_price NUMERIC(10,2) NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      amount NUMERIC(10,2) NOT NULL,
      method VARCHAR(20) NOT NULL CHECK (method IN ('cash', 'electronic')),
      reference_number VARCHAR(100),
      received_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS attendances (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      check_in_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS notification_logs (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      type VARCHAR(30) NOT NULL CHECK (type IN ('renewal_reminder', 'expired_notice')),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
      message TEXT NOT NULL,
      error_message TEXT,
      sent_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_member_id ON subscriptions(member_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendances_member_id ON attendances(member_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendances_check_in_at ON attendances(check_in_at);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendances_subscription_id ON attendances(subscription_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notification_logs_member_id ON notification_logs(member_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);`);
    console.log('Migrations completed successfully!');
    await pool.end();
    process.exit(0);
}
migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map