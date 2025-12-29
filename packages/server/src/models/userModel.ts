import db, { getCurrentTimestamp } from '../db/index.ts';
import type { User, CreateUserInput, UpdateUserInput } from '@event-noti/shared';

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  role: 'admin' | 'user';
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Convert database row to User type
function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Find all users
export function findAll(): User[] {
  const rows = db.prepare(`
    SELECT id, username, display_name, role, is_active, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `).all() as UserRow[];

  return rows.map(rowToUser);
}

// Find user by ID
export function findById(id: number): User | null {
  const row = db.prepare(`
    SELECT id, username, display_name, role, is_active, created_at, updated_at
    FROM users WHERE id = ?
  `).get(id) as UserRow | undefined;

  return row ? rowToUser(row) : null;
}

// Find user by username (includes password_hash for auth)
export function findByUsername(username: string): (User & { passwordHash: string }) | null {
  const row = db.prepare(`
    SELECT id, username, password_hash, display_name, role, is_active, created_at, updated_at
    FROM users WHERE username = ?
  `).get(username) as UserRow | undefined;

  if (!row) return null;

  return {
    ...rowToUser(row),
    passwordHash: row.password_hash,
  };
}

// Create user
export function create(input: CreateUserInput & { passwordHash: string }): User {
  const now = getCurrentTimestamp();
  const role = input.role || 'user';

  const result = db.prepare(`
    INSERT INTO users (username, password_hash, display_name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(input.username, input.passwordHash, input.displayName, role, now, now);

  return findById(result.lastInsertRowid as number)!;
}

// Update user
export function update(id: number, input: UpdateUserInput, passwordHash?: string): User | null {
  const user = findById(id);
  if (!user) return null;

  const updates: string[] = [];
  const values: (string | number | boolean)[] = [];

  if (input.displayName !== undefined) {
    updates.push('display_name = ?');
    values.push(input.displayName);
  }
  if (passwordHash !== undefined) {
    updates.push('password_hash = ?');
    values.push(passwordHash);
  }
  if (input.role !== undefined) {
    updates.push('role = ?');
    values.push(input.role);
  }
  if (input.isActive !== undefined) {
    updates.push('is_active = ?');
    values.push(input.isActive ? 1 : 0);
  }

  if (updates.length === 0) return user;

  updates.push('updated_at = ?');
  values.push(getCurrentTimestamp());
  values.push(id);

  db.prepare(`
    UPDATE users SET ${updates.join(', ')} WHERE id = ?
  `).run(...values);

  return findById(id);
}

// Soft delete user (set is_active = 0)
export function remove(id: number): boolean {
  const result = db.prepare(`
    UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?
  `).run(getCurrentTimestamp(), id);

  return result.changes > 0;
}

// Check if username exists
export function usernameExists(username: string, excludeId?: number): boolean {
  const query = excludeId
    ? 'SELECT id FROM users WHERE username = ? AND id != ?'
    : 'SELECT id FROM users WHERE username = ?';

  const params = excludeId ? [username, excludeId] : [username];
  const row = db.prepare(query).get(...params);

  return !!row;
}
