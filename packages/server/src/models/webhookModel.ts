import db, { getCurrentTimestamp } from '../db/index.ts';
import type { Webhook, CreateWebhookInput, UpdateWebhookInput } from '@event-noti/shared';

interface WebhookRow {
  id: number;
  name: string;
  url: string;
  is_default: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Convert database row to Webhook type
function rowToWebhook(row: WebhookRow): Webhook {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    isDefault: Boolean(row.is_default),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Find all webhooks
export function findAll(): Webhook[] {
  const rows = db.prepare(`
    SELECT * FROM webhooks ORDER BY is_default DESC, name ASC
  `).all() as WebhookRow[];

  return rows.map(rowToWebhook);
}

// Find webhook by ID
export function findById(id: number): Webhook | null {
  const row = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id) as WebhookRow | undefined;
  return row ? rowToWebhook(row) : null;
}

// Find default webhook
export function findDefault(): Webhook | null {
  const row = db.prepare('SELECT * FROM webhooks WHERE is_default = 1').get() as WebhookRow | undefined;
  return row ? rowToWebhook(row) : null;
}

// Create webhook
export function create(userId: number, input: CreateWebhookInput): Webhook {
  const now = getCurrentTimestamp();
  const isDefault = input.isDefault ? 1 : 0;

  // If setting as default, unset other defaults
  if (isDefault) {
    db.prepare('UPDATE webhooks SET is_default = 0').run();
  }

  const result = db.prepare(`
    INSERT INTO webhooks (name, url, is_default, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(input.name, input.url, isDefault, userId, now, now);

  return findById(result.lastInsertRowid as number)!;
}

// Update webhook
export function update(id: number, input: UpdateWebhookInput): Webhook | null {
  const webhook = findById(id);
  if (!webhook) return null;

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.url !== undefined) {
    updates.push('url = ?');
    values.push(input.url);
  }
  if (input.isDefault !== undefined) {
    // If setting as default, unset other defaults first
    if (input.isDefault) {
      db.prepare('UPDATE webhooks SET is_default = 0').run();
    }
    updates.push('is_default = ?');
    values.push(input.isDefault ? 1 : 0);
  }

  if (updates.length === 0) return webhook;

  updates.push('updated_at = ?');
  values.push(getCurrentTimestamp());
  values.push(id);

  db.prepare(`UPDATE webhooks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return findById(id);
}

// Delete webhook
export function remove(id: number): boolean {
  // Groups with this webhook will have webhook_id set to NULL via FK
  const result = db.prepare('DELETE FROM webhooks WHERE id = ?').run(id);
  return result.changes > 0;
}

// Check if webhook is used by any groups
export function isUsedByGroups(id: number): boolean {
  const row = db.prepare('SELECT id FROM groups WHERE webhook_id = ? LIMIT 1').get(id);
  return !!row;
}

// Get groups using this webhook
export function getGroupsUsingWebhook(id: number): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM groups WHERE webhook_id = ?').get(id) as { count: number };
  return result.count;
}
