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

  console.log('✅ Database schema initialized');

  // Seed admin user if not exists
  seedAdminUser();
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
