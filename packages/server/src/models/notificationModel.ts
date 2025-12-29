import db, { getCurrentTimestamp } from '../db/index.ts';
import type { Notification } from '@event-noti/shared';
import * as settingsService from '../services/settingsService.ts';

interface NotificationRow {
  id: number;
  event_id: number;
  scheduled_date: string;
  scheduled_time: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  retry_count: number;
  created_at: string;
  // Joined fields
  event_title?: string;
  event_content?: string | null;
  event_target_date?: string;
  event_target_time?: string;
  event_user_id?: number;
}

// Convert database row to Notification type
function rowToNotification(row: NotificationRow): Notification {
  const notification: Notification = {
    id: row.id,
    eventId: row.event_id,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time || '09:00',
    sentAt: row.sent_at,
    status: row.status,
    errorMessage: row.error_message,
    retryCount: row.retry_count,
    createdAt: row.created_at,
  };

  if (row.event_title) {
    notification.event = {
      id: row.event_id,
      title: row.event_title,
      content: row.event_content || null,
      targetDate: row.event_target_date || '',
      targetTime: row.event_target_time || '09:00',
      remindDays: 0,
      groupId: null,
      userId: row.event_user_id || 0,
      status: 'active',
      createdAt: '',
      updatedAt: '',
    };
  }

  return notification;
}

// Find notifications by user with pagination
export function findByUserId(
  userId: number,
  options: { page?: number; limit?: number; status?: string } = {}
): { data: Notification[]; total: number } {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM notifications n
    INNER JOIN events e ON n.event_id = e.id
    WHERE e.user_id = ?
  `;
  let dataQuery = `
    SELECT n.*, e.title as event_title, e.content as event_content,
           e.target_date as event_target_date, e.user_id as event_user_id
    FROM notifications n
    INNER JOIN events e ON n.event_id = e.id
    WHERE e.user_id = ?
  `;

  const params: (string | number)[] = [userId];

  if (options.status) {
    countQuery += ' AND n.status = ?';
    dataQuery += ' AND n.status = ?';
    params.push(options.status);
  }

  dataQuery += ' ORDER BY n.scheduled_date DESC LIMIT ? OFFSET ?';

  const countResult = db.prepare(countQuery).get(...params) as { total: number };
  const rows = db.prepare(dataQuery).all(...params, limit, offset) as NotificationRow[];

  return {
    data: rows.map(rowToNotification),
    total: countResult.total,
  };
}

// Find pending notifications for a specific date
export function findPendingByDate(date: string): Notification[] {
  const rows = db.prepare(`
    SELECT n.*, e.title as event_title, e.content as event_content,
           e.target_date as event_target_date, e.target_time as event_target_time, e.user_id as event_user_id
    FROM notifications n
    INNER JOIN events e ON n.event_id = e.id
    WHERE n.scheduled_date = ? AND n.status = 'pending'
    ORDER BY n.scheduled_time ASC, e.target_date ASC
  `).all(date) as NotificationRow[];

  return rows.map(rowToNotification);
}

// Find pending notifications for a specific date and time (for minute-level scheduling)
export function findPendingByDateTime(date: string, time: string): Notification[] {
  const rows = db.prepare(`
    SELECT n.*, e.title as event_title, e.content as event_content,
           e.target_date as event_target_date, e.target_time as event_target_time, e.user_id as event_user_id
    FROM notifications n
    INNER JOIN events e ON n.event_id = e.id
    WHERE n.scheduled_date = ? AND n.scheduled_time = ? AND n.status = 'pending'
    ORDER BY e.target_date ASC
  `).all(date, time) as NotificationRow[];

  return rows.map(rowToNotification);
}

// Find notification by ID
export function findById(id: number): Notification | null {
  const row = db.prepare(`
    SELECT n.*, e.title as event_title, e.content as event_content,
           e.target_date as event_target_date, e.user_id as event_user_id
    FROM notifications n
    INNER JOIN events e ON n.event_id = e.id
    WHERE n.id = ?
  `).get(id) as NotificationRow | undefined;

  return row ? rowToNotification(row) : null;
}

// Generate notification records for an event based on smart rules
// Rules:
// 1. Event creation: immediate confirmation notification (today)
// 2. Remaining > 30 days: notify every 30 days
// 3. Remaining <= 30 and > 7 days: notify every 7 days
// 4. Remaining <= 7 and > 3 days: notify every 3 days
// 5. Remaining <= 3 days: notify daily
// 6. Target date: final reminder
export function generateForEvent(eventId: number, targetDate: string, _remindDays: number, targetTime: string = '09:00'): void {
  const now = getCurrentTimestamp();
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const stmt = db.prepare(`
    INSERT INTO notifications (event_id, scheduled_date, scheduled_time, created_at)
    VALUES (?, ?, ?, ?)
  `);

  // Get today's date in configured timezone
  const todayStr = settingsService.getTodayInTimezone();
  const today = new Date(todayStr);
  today.setHours(0, 0, 0, 0);

  // Calculate notification dates
  const notificationDates = new Set<string>();

  // Rule 1: Immediate notification (today) - always add
  notificationDates.add(todayStr);

  // Rule 6: Target date (final reminder) - always add if not in the past
  const targetStr = target.toISOString().split('T')[0];
  if (targetStr >= todayStr) {
    notificationDates.add(targetStr);
  }

  // Calculate days from today to target
  const totalDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (totalDays > 0) {
    // Iterate from today to target and determine which days to notify
    for (let daysFromNow = 1; daysFromNow < totalDays; daysFromNow++) {
      const notifyDate = new Date(today);
      notifyDate.setDate(notifyDate.getDate() + daysFromNow);
      const daysRemaining = totalDays - daysFromNow;

      let shouldNotify = false;

      if (daysRemaining > 30) {
        // Rule 2: Every 30 days when > 30 days remaining
        // Notify on days where daysRemaining is a multiple of 30
        shouldNotify = daysRemaining % 30 === 0;
      } else if (daysRemaining > 7) {
        // Rule 3: Every 7 days when 8-30 days remaining
        shouldNotify = daysRemaining % 7 === 0;
      } else if (daysRemaining > 3) {
        // Rule 4: Every 3 days when 4-7 days remaining
        shouldNotify = daysRemaining % 3 === 0;
      } else {
        // Rule 5: Daily when <= 3 days remaining
        shouldNotify = true;
      }

      if (shouldNotify) {
        const dateStr = notifyDate.toISOString().split('T')[0];
        notificationDates.add(dateStr);
      }
    }
  }

  // Insert all notification records
  const sortedDates = Array.from(notificationDates).sort();
  for (const dateStr of sortedDates) {
    stmt.run(eventId, dateStr, targetTime, now);
  }
}

// Delete notifications for an event
export function deleteByEventId(eventId: number): void {
  db.prepare('DELETE FROM notifications WHERE event_id = ?').run(eventId);
}

// Update notification status
export function updateStatus(
  id: number,
  status: 'pending' | 'sent' | 'failed',
  errorMessage?: string
): void {
  const now = getCurrentTimestamp();

  if (status === 'sent') {
    db.prepare(`
      UPDATE notifications SET status = ?, sent_at = ? WHERE id = ?
    `).run(status, now, id);
  } else if (status === 'failed') {
    db.prepare(`
      UPDATE notifications
      SET status = ?, error_message = ?, retry_count = retry_count + 1
      WHERE id = ?
    `).run(status, errorMessage || null, id);
  } else {
    db.prepare(`
      UPDATE notifications SET status = ? WHERE id = ?
    `).run(status, id);
  }
}

// Reset failed notification for retry
export function resetForRetry(id: number): void {
  db.prepare(`
    UPDATE notifications SET status = 'pending', error_message = NULL WHERE id = ?
  `).run(id);
}

// Delete a notification by ID
export function remove(id: number): boolean {
  const result = db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
  return result.changes > 0;
}

// Get failed notifications that can be retried
export function findFailedForRetry(maxRetries: number = 3): Notification[] {
  // Use timezone-aware today
  const today = settingsService.getTodayInTimezone();

  const rows = db.prepare(`
    SELECT n.*, e.title as event_title, e.content as event_content,
           e.target_date as event_target_date, e.user_id as event_user_id
    FROM notifications n
    INNER JOIN events e ON n.event_id = e.id
    WHERE n.status = 'failed' AND n.retry_count < ? AND n.scheduled_date = ?
    ORDER BY n.created_at ASC
  `).all(maxRetries, today) as NotificationRow[];

  return rows.map(rowToNotification);
}
