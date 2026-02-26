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

  // Migration 2.1: Sync notifications.scheduled_time with events.target_time
  // This fixes existing notifications that got default '09:00' instead of event's target_time
  const needsSync = db.prepare(`
    SELECT COUNT(*) as count FROM notifications n
    INNER JOIN events e ON n.event_id = e.id
    WHERE n.scheduled_time != e.target_time AND n.status = 'pending'
  `).get() as { count: number };

  if (needsSync.count > 0) {
    db.exec(`
      UPDATE notifications SET scheduled_time = (
        SELECT e.target_time FROM events e WHERE e.id = notifications.event_id
      )
      WHERE event_id IN (SELECT id FROM events)
    `);
    console.log(`✅ Migration: Synced ${needsSync.count} notifications with event target_time`);
  }

  // Migration 3: Add message_format column to events table
  if (!eventsInfo.some((col) => col.name === 'message_format')) {
    db.exec("ALTER TABLE events ADD COLUMN message_format TEXT DEFAULT 'text'");
    console.log('✅ Migration: Added message_format column to events');
  }

  // Migration 4: Create settings table if not exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get();
  if (!tables) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.exec("INSERT OR IGNORE INTO settings (key, value) VALUES ('timezone', 'Asia/Shanghai')");
    console.log('✅ Migration: Created settings table with default timezone');
  }

  // Migration 5: Ensure user_groups table exists
  const userGroupsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_groups'").get();
  if (!userGroupsTable) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        assigned_by INTEGER NOT NULL REFERENCES users(id),
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, group_id)
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups(group_id)');
    console.log('✅ Migration: Created user_groups table');
  }

  // Migration 5.1: Ensure groups.created_by exists and sync legacy groups.user_id data
  const groupsInfoForMigration = db.prepare("PRAGMA table_info(groups)").all() as { name: string }[];
  const hasUserId = groupsInfoForMigration.some((col) => col.name === 'user_id');
  const hasCreatedBy = groupsInfoForMigration.some((col) => col.name === 'created_by');

  if (!hasCreatedBy) {
    db.exec('ALTER TABLE groups ADD COLUMN created_by INTEGER REFERENCES users(id)');
    console.log('✅ Migration: Added created_by column to groups');
  }

  if (hasUserId) {
    const backfillCreatedBy = db.prepare(`
      UPDATE groups
      SET created_by = user_id
      WHERE created_by IS NULL AND user_id IS NOT NULL
    `).run();

    const syncAssignments = db.prepare(`
      INSERT OR IGNORE INTO user_groups (user_id, group_id, assigned_by, assigned_at)
      SELECT user_id, id, user_id, created_at FROM groups WHERE user_id IS NOT NULL
    `).run();

    if (backfillCreatedBy.changes > 0 || syncAssignments.changes > 0) {
      console.log(
        `✅ Migration: Synced legacy group ownership data (created_by: ${backfillCreatedBy.changes}, assignments: ${syncAssignments.changes})`
      );
    }
  }

  // Migration 6: Create index on groups.created_by if column exists
  const groupsInfo = db.prepare("PRAGMA table_info(groups)").all() as { name: string }[];
  if (groupsInfo.some((col) => col.name === 'created_by')) {
    db.exec('CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by)');
  }

  // Ensure user_groups indexes exist
  db.exec('CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups(group_id)');
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

// Helper for getting current timestamp (ISO format with timezone indicator)
export function getCurrentTimestamp(): string {
  // Return ISO format with 'Z' suffix so frontend can correctly parse as UTC
  return new Date().toISOString();
}
