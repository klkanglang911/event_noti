import db, { getCurrentTimestamp } from '../db/index.ts';
import type { RecurringReminder, CreateRecurringReminderInput, UpdateRecurringReminderInput, ReminderCategory, ReminderStatus } from '@event-noti/shared';

interface RecurringReminderRow {
  id: number;
  user_id: number;
  title: string;
  content: string | null;
  category: string;
  interval_minutes: number;
  start_time: string;
  end_time: string;
  workdays_only: number;
  group_id: number | null;
  message_format: string;
  status: string;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  group_name?: string;
  group_color?: string;
  webhook_id?: number;
}

// Convert database row to RecurringReminder type
function rowToRecurringReminder(row: RecurringReminderRow): RecurringReminder {
  const reminder: RecurringReminder = {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    category: row.category as ReminderCategory,
    intervalMinutes: row.interval_minutes,
    startTime: row.start_time || '09:00',
    endTime: row.end_time || '18:00',
    workdaysOnly: row.workdays_only === 1,
    groupId: row.group_id,
    messageFormat: (row.message_format as 'text' | 'markdown') || 'text',
    status: row.status as ReminderStatus,
    lastSentAt: row.last_sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.group_name) {
    reminder.group = {
      id: row.group_id!,
      name: row.group_name,
      color: row.group_color || '#3B82F6',
      webhookId: row.webhook_id || null,
      userId: row.user_id,
      createdAt: '',
      updatedAt: '',
    };
  }

  return reminder;
}

// Find all recurring reminders for a user
export function findByUserId(userId: number, category?: ReminderCategory): RecurringReminder[] {
  let query = `
    SELECT r.*, g.name as group_name, g.color as group_color, g.webhook_id
    FROM recurring_reminders r
    LEFT JOIN groups g ON r.group_id = g.id
    WHERE r.user_id = ?
  `;
  const params: (number | string)[] = [userId];

  if (category) {
    query += ' AND r.category = ?';
    params.push(category);
  }

  query += ' ORDER BY r.category ASC, r.created_at DESC';

  const rows = db.prepare(query).all(...params) as RecurringReminderRow[];
  return rows.map(rowToRecurringReminder);
}

// Find recurring reminder by ID
export function findById(id: number): RecurringReminder | null {
  const row = db.prepare(`
    SELECT r.*, g.name as group_name, g.color as group_color, g.webhook_id
    FROM recurring_reminders r
    LEFT JOIN groups g ON r.group_id = g.id
    WHERE r.id = ?
  `).get(id) as RecurringReminderRow | undefined;

  return row ? rowToRecurringReminder(row) : null;
}

// Find all active recurring reminders (for scheduler)
export function findActive(): RecurringReminder[] {
  const rows = db.prepare(`
    SELECT r.*, g.name as group_name, g.color as group_color, g.webhook_id
    FROM recurring_reminders r
    LEFT JOIN groups g ON r.group_id = g.id
    WHERE r.status = 'active'
    ORDER BY r.user_id ASC
  `).all() as RecurringReminderRow[];

  return rows.map(rowToRecurringReminder);
}

// Create recurring reminder
export function create(userId: number, input: CreateRecurringReminderInput): RecurringReminder {
  const now = getCurrentTimestamp();
  const startTime = input.startTime || '09:00';
  const endTime = input.endTime || '18:00';
  const workdaysOnly = input.workdaysOnly !== undefined ? (input.workdaysOnly ? 1 : 0) : 1;
  const messageFormat = input.messageFormat || 'text';
  const category = input.category || 'custom';

  const result = db.prepare(`
    INSERT INTO recurring_reminders (user_id, title, content, category, interval_minutes, start_time, end_time, workdays_only, group_id, message_format, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    input.title,
    input.content || null,
    category,
    input.intervalMinutes,
    startTime,
    endTime,
    workdaysOnly,
    input.groupId || null,
    messageFormat,
    now,
    now
  );

  const reminderId = result.lastInsertRowid as number;
  return findById(reminderId)!;
}

// Update recurring reminder
export function update(id: number, input: UpdateRecurringReminderInput): RecurringReminder | null {
  const reminder = findById(id);
  if (!reminder) return null;

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.title !== undefined) {
    updates.push('title = ?');
    values.push(input.title);
  }
  if (input.content !== undefined) {
    updates.push('content = ?');
    values.push(input.content);
  }
  if (input.category !== undefined) {
    updates.push('category = ?');
    values.push(input.category);
  }
  if (input.intervalMinutes !== undefined) {
    updates.push('interval_minutes = ?');
    values.push(input.intervalMinutes);
  }
  if (input.startTime !== undefined) {
    updates.push('start_time = ?');
    values.push(input.startTime);
  }
  if (input.endTime !== undefined) {
    updates.push('end_time = ?');
    values.push(input.endTime);
  }
  if (input.workdaysOnly !== undefined) {
    updates.push('workdays_only = ?');
    values.push(input.workdaysOnly ? 1 : 0);
  }
  if (input.groupId !== undefined) {
    updates.push('group_id = ?');
    values.push(input.groupId);
  }
  if (input.messageFormat !== undefined) {
    updates.push('message_format = ?');
    values.push(input.messageFormat);
  }
  if (input.status !== undefined) {
    updates.push('status = ?');
    values.push(input.status);
  }

  if (updates.length === 0) return reminder;

  updates.push('updated_at = ?');
  values.push(getCurrentTimestamp());
  values.push(id);

  db.prepare(`UPDATE recurring_reminders SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return findById(id);
}

// Delete recurring reminder
export function remove(id: number): boolean {
  const result = db.prepare('DELETE FROM recurring_reminders WHERE id = ?').run(id);
  return result.changes > 0;
}

// Update status
export function updateStatus(id: number, status: ReminderStatus): void {
  db.prepare(`
    UPDATE recurring_reminders SET status = ?, updated_at = ? WHERE id = ?
  `).run(status, getCurrentTimestamp(), id);
}

// Update last sent timestamp
export function updateLastSentAt(id: number): void {
  const now = getCurrentTimestamp();
  db.prepare(`
    UPDATE recurring_reminders SET last_sent_at = ?, updated_at = ? WHERE id = ?
  `).run(now, now, id);
}

// Check if recurring reminder belongs to user
export function belongsToUser(id: number, userId: number): boolean {
  const row = db.prepare('SELECT user_id FROM recurring_reminders WHERE id = ?').get(id) as { user_id: number } | undefined;
  return row?.user_id === userId;
}
