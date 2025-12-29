import db, { getCurrentTimestamp } from '../db/index.ts';
import type { Group, CreateGroupInput, UpdateGroupInput } from '@event-noti/shared';

interface GroupRow {
  id: number;
  name: string;
  color: string;
  webhook_id: number | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  webhook_name?: string;
  webhook_url?: string;
  event_count?: number;
}

// Convert database row to Group type
function rowToGroup(row: GroupRow): Group {
  const group: Group = {
    id: row.id,
    name: row.name,
    color: row.color,
    webhookId: row.webhook_id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.webhook_name) {
    group.webhook = {
      id: row.webhook_id!,
      name: row.webhook_name,
      url: row.webhook_url || '',
      isDefault: false,
      createdBy: 0,
      createdAt: '',
      updatedAt: '',
    };
  }

  if (row.event_count !== undefined) {
    group.eventCount = row.event_count;
  }

  return group;
}

// Find all groups for a user
export function findByUserId(userId: number): Group[] {
  const rows = db.prepare(`
    SELECT g.*, w.name as webhook_name, w.url as webhook_url,
           (SELECT COUNT(*) FROM events WHERE group_id = g.id) as event_count
    FROM groups g
    LEFT JOIN webhooks w ON g.webhook_id = w.id
    WHERE g.user_id = ?
    ORDER BY g.name ASC
  `).all(userId) as GroupRow[];

  return rows.map(rowToGroup);
}

// Find group by ID
export function findById(id: number): Group | null {
  const row = db.prepare(`
    SELECT g.*, w.name as webhook_name, w.url as webhook_url,
           (SELECT COUNT(*) FROM events WHERE group_id = g.id) as event_count
    FROM groups g
    LEFT JOIN webhooks w ON g.webhook_id = w.id
    WHERE g.id = ?
  `).get(id) as GroupRow | undefined;

  return row ? rowToGroup(row) : null;
}

// Create group
export function create(userId: number, input: CreateGroupInput): Group {
  const now = getCurrentTimestamp();
  const color = input.color || '#3B82F6';

  const result = db.prepare(`
    INSERT INTO groups (name, color, webhook_id, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(input.name, color, input.webhookId || null, userId, now, now);

  return findById(result.lastInsertRowid as number)!;
}

// Update group
export function update(id: number, input: UpdateGroupInput): Group | null {
  const group = findById(id);
  if (!group) return null;

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.color !== undefined) {
    updates.push('color = ?');
    values.push(input.color);
  }
  if (input.webhookId !== undefined) {
    updates.push('webhook_id = ?');
    values.push(input.webhookId);
  }

  if (updates.length === 0) return group;

  updates.push('updated_at = ?');
  values.push(getCurrentTimestamp());
  values.push(id);

  db.prepare(`UPDATE groups SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return findById(id);
}

// Delete group (events.group_id will be set to NULL via FK)
export function remove(id: number): boolean {
  // First set events.group_id to NULL for this group
  db.prepare('UPDATE events SET group_id = NULL WHERE group_id = ?').run(id);

  const result = db.prepare('DELETE FROM groups WHERE id = ?').run(id);
  return result.changes > 0;
}

// Check if group belongs to user
export function belongsToUser(id: number, userId: number): boolean {
  const row = db.prepare('SELECT id FROM groups WHERE id = ? AND user_id = ?').get(id, userId);
  return !!row;
}
