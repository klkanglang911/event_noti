import db, { getCurrentTimestamp } from '../db/index.ts';
import type { CalendarSubscription, UpdateCalendarSubscriptionInput } from '@event-noti/shared';

interface CalendarSubscriptionRow {
  id: number;
  user_id: number;
  enabled: number;
  advance_days: number;
  target_time: string;
  group_id: number | null;
  message_format: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  group_name?: string;
  group_color?: string;
  webhook_id?: number;
}

function rowToSubscription(row: CalendarSubscriptionRow): CalendarSubscription {
  const sub: CalendarSubscription = {
    id: row.id,
    userId: row.user_id,
    enabled: row.enabled === 1,
    advanceDays: row.advance_days,
    targetTime: row.target_time || '09:00',
    groupId: row.group_id,
    messageFormat: (row.message_format as 'text' | 'markdown') || 'text',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.group_name) {
    sub.group = {
      id: row.group_id!,
      name: row.group_name,
      color: row.group_color || '#3B82F6',
      webhookId: row.webhook_id || null,
      userId: row.user_id,
      createdAt: '',
      updatedAt: '',
    };
  }

  return sub;
}

// Find a user's subscription (single record per user)
export function findByUserId(userId: number): CalendarSubscription | null {
  const row = db.prepare(`
    SELECT s.*, g.name as group_name, g.color as group_color, g.webhook_id
    FROM calendar_subscriptions s
    LEFT JOIN groups g ON s.group_id = g.id
    WHERE s.user_id = ?
  `).get(userId) as CalendarSubscriptionRow | undefined;

  return row ? rowToSubscription(row) : null;
}

// Find all enabled subscriptions (for scheduler)
export function findEnabled(): CalendarSubscription[] {
  const rows = db.prepare(`
    SELECT s.*, g.name as group_name, g.color as group_color, g.webhook_id
    FROM calendar_subscriptions s
    LEFT JOIN groups g ON s.group_id = g.id
    WHERE s.enabled = 1
  `).all() as CalendarSubscriptionRow[];

  return rows.map(rowToSubscription);
}

// Upsert subscription for a user (create with defaults if missing)
export function upsert(userId: number, input: UpdateCalendarSubscriptionInput): CalendarSubscription {
  const existing = findByUserId(userId);
  const now = getCurrentTimestamp();

  if (!existing) {
    db.prepare(`
      INSERT INTO calendar_subscriptions (user_id, enabled, advance_days, target_time, group_id, message_format, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      input.enabled !== undefined ? (input.enabled ? 1 : 0) : 0,
      input.advanceDays ?? 7,
      input.targetTime || '09:00',
      input.groupId ?? null,
      input.messageFormat || 'text',
      now,
      now
    );

    return findByUserId(userId)!;
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.enabled !== undefined) {
    updates.push('enabled = ?');
    values.push(input.enabled ? 1 : 0);
  }
  if (input.advanceDays !== undefined) {
    updates.push('advance_days = ?');
    values.push(input.advanceDays);
  }
  if (input.targetTime !== undefined) {
    updates.push('target_time = ?');
    values.push(input.targetTime);
  }
  if (input.groupId !== undefined) {
    updates.push('group_id = ?');
    values.push(input.groupId);
  }
  if (input.messageFormat !== undefined) {
    updates.push('message_format = ?');
    values.push(input.messageFormat);
  }

  if (updates.length > 0) {
    updates.push('updated_at = ?');
    values.push(now);
    values.push(existing.id);

    db.prepare(`UPDATE calendar_subscriptions SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  return findByUserId(userId)!;
}

// Check if subscription belongs to user
export function belongsToUser(id: number, userId: number): boolean {
  const row = db.prepare('SELECT user_id FROM calendar_subscriptions WHERE id = ?').get(id) as { user_id: number } | undefined;
  return row?.user_id === userId;
}
