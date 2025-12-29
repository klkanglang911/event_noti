import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../../../../data');
const DB_PATH = path.join(DATA_DIR, 'event-noti.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase(): void {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Execute schema
  db.exec(schema);

  // Run migrations for existing databases
  runMigrations();

  console.log('✅ Database schema initialized');

  // Seed admin user if not exists
  seedAdminUser();
}

// Run database migrations
function runMigrations(): void {
  // Migration 1: Add target_time column to events table
  const eventsInfo = db.prepare("PRAGMA table_info(events)").all() as { name: string }[];
  if (!eventsInfo.some((col) => col.name === 'target_time')) {
    db.exec("ALTER TABLE events ADD COLUMN target_time TEXT DEFAULT '09:00'");
    console.log('✅ Migration: Added target_time column to events');
  }

  // Migration 2: Add scheduled_time column to notifications table
  const notificationsInfo = db.prepare("PRAGMA table_info(notifications)").all() as { name: string }[];
  if (!notificationsInfo.some((col) => col.name === 'scheduled_time')) {
    db.exec("ALTER TABLE notifications ADD COLUMN scheduled_time TEXT DEFAULT '09:00'");
    console.log('✅ Migration: Added scheduled_time column to notifications');
  }
}

// Seed default admin user
function seedAdminUser(): void {
  const existingAdmin = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get('admin');

  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync('admin123', 12);

    db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', passwordHash, '管理员', 'admin');

    console.log('✅ Default admin user created (username: admin, password: admin123)');
  }
}

// Initialize on import
initializeDatabase();

// Export database instance
export default db;

// Helper for transactions
export function transaction<T>(fn: () => T): T {
  return db.transaction(fn)();
}

// Helper for getting current timestamp
export function getCurrentTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}
