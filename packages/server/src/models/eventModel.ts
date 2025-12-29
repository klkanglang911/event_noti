import db, { getCurrentTimestamp, transaction } from '../db/index.ts';
import type { Event, CreateEventInput, UpdateEventInput } from '@event-noti/shared';
import * as notificationModel from './notificationModel.ts';
import * as settingsService from '../services/settingsService.ts';

interface EventRow {
  id: number;
  title: string;
  content: string | null;
  target_date: string;
  target_time: string;
  remind_days: number;
  message_format: 'text' | 'markdown';
  group_id: number | null;
  user_id: number;
  status: 'active' | 'expired' | 'completed';
  created_at: string;
  updated_at: string;
  // Joined fields
  group_name?: string;
  group_color?: string;
  webhook_id?: number;
}

// Convert database row to Event type
function rowToEvent(row: EventRow): Event {
  // Use timezone-aware today for daysRemaining calculation
  const todayStr = settingsService.getTodayInTimezone();
  const today = new Date(todayStr);
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(row.target_date);
  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const event: Event = {
    id: row.id,
    title: row.title,
    content: row.content,
    targetDate: row.target_date,
    targetTime: row.target_time || '09:00',
    remindDays: row.remind_days,
    messageFormat: row.message_format || 'text',
    groupId: row.group_id,
    userId: row.user_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    daysRemaining,
  };

  if (row.group_name) {
    event.group = {
      id: row.group_id!,
      name: row.group_name,
      color: row.group_color || '#3B82F6',
      webhookId: row.webhook_id || null,
      userId: row.user_id,
      createdAt: '',
      updatedAt: '',
    };
  }

  return event;
}

// Find all events for a user
export function findByUserId(userId: number, groupId?: number): Event[] {
  let query = `
    SELECT e.*, g.name as group_name, g.color as group_color, g.webhook_id
    FROM events e
    LEFT JOIN groups g ON e.group_id = g.id
    WHERE e.user_id = ?
  `;
  const params: (number | string)[] = [userId];

  if (groupId !== undefined) {
    query += ' AND e.group_id = ?';
    params.push(groupId);
  }

  query += ' ORDER BY e.target_date ASC, e.created_at DESC';

  const rows = db.prepare(query).all(...params) as EventRow[];
  return rows.map(rowToEvent);
}

// Find event by ID
export function findById(id: number): Event | null {
  const row = db.prepare(`
    SELECT e.*, g.name as group_name, g.color as group_color, g.webhook_id
    FROM events e
    LEFT JOIN groups g ON e.group_id = g.id
    WHERE e.id = ?
  `).get(id) as EventRow | undefined;

  return row ? rowToEvent(row) : null;
}

// Create event with notifications
export function create(userId: number, input: CreateEventInput): Event {
  return transaction(() => {
    const now = getCurrentTimestamp();
    const targetTime = input.targetTime || '09:00';
    const messageFormat = input.messageFormat || 'text';

    const result = db.prepare(`
      INSERT INTO events (title, content, target_date, target_time, remind_days, message_format, group_id, user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.title,
      input.content || null,
      input.targetDate,
      targetTime,
      input.remindDays,
      messageFormat,
      input.groupId || null,
      userId,
      now,
      now
    );

    const eventId = result.lastInsertRowid as number;

    // Generate notification records
    notificationModel.generateForEvent(eventId, input.targetDate, input.remindDays, targetTime);

    return findById(eventId)!;
  });
}

// Update event
export function update(id: number, input: UpdateEventInput): Event | null {
  const event = findById(id);
  if (!event) return null;

  return transaction(() => {
    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let needRegenerateNotifications = false;

    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
    }
    if (input.content !== undefined) {
      updates.push('content = ?');
      values.push(input.content);
    }
    if (input.targetDate !== undefined) {
      updates.push('target_date = ?');
      values.push(input.targetDate);
      needRegenerateNotifications = true;
    }
    if (input.targetTime !== undefined) {
      updates.push('target_time = ?');
      values.push(input.targetTime);
      needRegenerateNotifications = true;
    }
    if (input.remindDays !== undefined) {
      updates.push('remind_days = ?');
      values.push(input.remindDays);
      needRegenerateNotifications = true;
    }
    if (input.messageFormat !== undefined) {
      updates.push('message_format = ?');
      values.push(input.messageFormat);
    }
    if (input.groupId !== undefined) {
      updates.push('group_id = ?');
      values.push(input.groupId);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }

    if (updates.length === 0) return event;

    updates.push('updated_at = ?');
    values.push(getCurrentTimestamp());
    values.push(id);

    db.prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Regenerate notifications if date, time or remind_days changed
    if (needRegenerateNotifications) {
      const updatedEvent = findById(id)!;
      notificationModel.deleteByEventId(id);
      notificationModel.generateForEvent(id, updatedEvent.targetDate, updatedEvent.remindDays, updatedEvent.targetTime);
    }

    return findById(id);
  });
}

// Delete event (cascade deletes notifications)
export function remove(id: number): boolean {
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(id);
  return result.changes > 0;
}

// Update expired events
export function markExpired(): number {
  // Use timezone-aware today
  const today = settingsService.getTodayInTimezone();
  const result = db.prepare(`
    UPDATE events
    SET status = 'expired', updated_at = ?
    WHERE status = 'active' AND target_date < ?
  `).run(getCurrentTimestamp(), today);

  return result.changes;
}

// Get events with upcoming notifications for today
export function findWithTodayNotifications(): Event[] {
  // Use timezone-aware today
  const today = settingsService.getTodayInTimezone();

  const rows = db.prepare(`
    SELECT DISTINCT e.*, g.name as group_name, g.color as group_color, g.webhook_id
    FROM events e
    LEFT JOIN groups g ON e.group_id = g.id
    INNER JOIN notifications n ON e.id = n.event_id
    WHERE n.scheduled_date = ? AND n.status = 'pending'
    ORDER BY e.target_date ASC
  `).all(today) as EventRow[];

  return rows.map(rowToEvent);
}
