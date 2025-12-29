import db, { getCurrentTimestamp } from '../db/index.ts';

interface SettingRow {
  key: string;
  value: string;
  updated_at: string;
}

// Get a setting by key
export function get(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as SettingRow | undefined;
  return row?.value || null;
}

// Get all settings
export function getAll(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as SettingRow[];
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {} as Record<string, string>);
}

// Set a setting
export function set(key: string, value: string): void {
  const now = getCurrentTimestamp();
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
  `).run(key, value, now, value, now);
}

// Get timezone setting
export function getTimezone(): string {
  return get('timezone') || 'Asia/Shanghai';
}

// Set timezone setting
export function setTimezone(timezone: string): void {
  set('timezone', timezone);
}
