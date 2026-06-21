import db from '../db/index.ts';
import type { CalendarSubscriptionLog } from '@event-noti/shared';

interface CalendarSubscriptionLogRow {
  id: number;
  subscription_id: number;
  calendar_key: string;
  event_date: string;
  sent_at: string;
  status: 'sent' | 'failed';
  error_message: string | null;
}

function rowToLog(row: CalendarSubscriptionLogRow): CalendarSubscriptionLog {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    calendarKey: row.calendar_key,
    eventDate: row.event_date,
    sentAt: row.sent_at,
    status: row.status,
    errorMessage: row.error_message,
  };
}

// Create a log entry
export function create(
  subscriptionId: number,
  calendarKey: string,
  eventDate: string,
  status: 'sent' | 'failed',
  errorMessage?: string
): void {
  db.prepare(`
    INSERT INTO calendar_subscription_logs (subscription_id, calendar_key, event_date, status, error_message)
    VALUES (?, ?, ?, ?, ?)
  `).run(subscriptionId, calendarKey, eventDate, status, errorMessage || null);
}

// 是否已成功发送（用于去重，防止同一天多次扫描重发）
export function alreadySent(subscriptionId: number, calendarKey: string, eventDate: string): boolean {
  const row = db.prepare(`
    SELECT 1 FROM calendar_subscription_logs
    WHERE subscription_id = ? AND calendar_key = ? AND event_date = ? AND status = 'sent'
    LIMIT 1
  `).get(subscriptionId, calendarKey, eventDate);
  return !!row;
}

// Find logs by subscription ID
export function findBySubscriptionId(subscriptionId: number, limit: number = 50): CalendarSubscriptionLog[] {
  const rows = db.prepare(`
    SELECT * FROM calendar_subscription_logs
    WHERE subscription_id = ?
    ORDER BY sent_at DESC
    LIMIT ?
  `).all(subscriptionId, limit) as CalendarSubscriptionLogRow[];

  return rows.map(rowToLog);
}
