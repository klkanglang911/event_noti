import db, { getCurrentTimestamp } from '../db/index.ts';
import type { Group, CreateGroupInput, UpdateGroupInput } from '@event-noti/shared';

interface GroupRow {
  id: number;
  name: string;
  color: string;
  webhook_id: number | null;
  created_by: number;
  user_id?: number; // Legacy column, may still exist
  created_at: string;
  updated_at: string;
  // Joined fields
  webhook_name?: string;
  webhook_url?: string;
  event_count?: number;
  assigned_user_count?: number;
}

interface UserGroupRow {
  user_id: number;
  username: string;
  display_name: string;
}

// Convert database row to Group type
function rowToGroup(row: GroupRow): Group {
  const group: Group = {
    id: row.id,
    name: row.name,
    color: row.color,
    webhookId: row.webhook_id,
    userId: row.created_by || row.user_id || 0, // Support both old and new schema
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

// Find all groups (admin only)
export function findAll(): Group[] {
  const rows = db.prepare(`
    SELECT g.*, w.name as webhook_name, w.url as webhook_url,
           (SELECT COUNT(*) FROM events WHERE group_id = g.id) as event_count
    FROM groups g
    LEFT JOIN webhooks w ON g.webhook_id = w.id
    ORDER BY g.name ASC
  `).all() as GroupRow[];

  return rows.map(rowToGroup);
}

// Find groups assigned to a user (for non-admin users)
export function findByUserId(userId: number): Group[] {
  const rows = db.prepare(`
    SELECT g.*, w.name as webhook_name, w.url as webhook_url,
           (SELECT COUNT(*) FROM events WHERE group_id = g.id) as event_count
    FROM groups g
    LEFT JOIN webhooks w ON g.webhook_id = w.id
    INNER JOIN user_groups ug ON g.id = ug.group_id
    WHERE ug.user_id = ?
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

// Create group (admin only)
export function create(createdBy: number, input: CreateGroupInput): Group {
  const now = getCurrentTimestamp();
  const color = input.color || '#3B82F6';

  const result = db.prepare(`
    INSERT INTO groups (name, color, webhook_id, user_id, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(input.name, color, input.webhookId || null, createdBy, createdBy, now, now);

  return findById(result.lastInsertRowid as number)!;
}

// Update group (admin only)
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

// Delete group (admin only, events.group_id will be set to NULL via FK)
export function remove(id: number): boolean {
  // First remove user assignments
  db.prepare('DELETE FROM user_groups WHERE group_id = ?').run(id);
  // Set events.group_id to NULL for this group
  db.prepare('UPDATE events SET group_id = NULL WHERE group_id = ?').run(id);
  // Delete the group
  const result = db.prepare('DELETE FROM groups WHERE id = ?').run(id);
  return result.changes > 0;
}

// Check if user has access to group (either assigned or admin)
export function userHasAccess(groupId: number, userId: number, isAdmin: boolean): boolean {
  if (isAdmin) return true;

  const row = db.prepare(`
    SELECT id FROM user_groups WHERE group_id = ? AND user_id = ?
  `).get(groupId, userId);

  return !!row;
}

// Get users assigned to a group
export function getAssignedUsers(groupId: number): UserGroupRow[] {
  return db.prepare(`
    SELECT u.id as user_id, u.username, u.display_name
    FROM users u
    INNER JOIN user_groups ug ON u.id = ug.user_id
    WHERE ug.group_id = ?
    ORDER BY u.display_name ASC
  `).all(groupId) as UserGroupRow[];
}

// Assign user to group
export function assignUser(groupId: number, userId: number, assignedBy: number): boolean {
  try {
    const now = getCurrentTimestamp();
    db.prepare(`
      INSERT OR IGNORE INTO user_groups (user_id, group_id, assigned_by, assigned_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, groupId, assignedBy, now);
    return true;
  } catch {
    return false;
  }
}

// Remove user from group
export function unassignUser(groupId: number, userId: number): boolean {
  const result = db.prepare(`
    DELETE FROM user_groups WHERE group_id = ? AND user_id = ?
  `).run(groupId, userId);
  return result.changes > 0;
}

// Batch assign users to group
export function setAssignedUsers(groupId: number, userIds: number[], assignedBy: number): void {
  const now = getCurrentTimestamp();

  // Remove existing assignments
  db.prepare('DELETE FROM user_groups WHERE group_id = ?').run(groupId);

  // Add new assignments
  const stmt = db.prepare(`
    INSERT INTO user_groups (user_id, group_id, assigned_by, assigned_at)
    VALUES (?, ?, ?, ?)
  `);

  for (const userId of userIds) {
    stmt.run(userId, groupId, assignedBy, now);
  }
}

// Legacy function for compatibility
export function belongsToUser(id: number, userId: number): boolean {
  return userHasAccess(id, userId, false);
}
