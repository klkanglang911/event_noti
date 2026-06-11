import db from '../db/index.ts';
import type { RecurringReminderLog } from '@event-noti/shared';

interface RecurringReminderLogRow {
  id: number;
  reminder_id: number;
  sent_at: string;
  status: 'sent' | 'failed';
  error_message: string | null;
}

// Convert database row to RecurringReminderLog type
function rowToLog(row: RecurringReminderLogRow): RecurringReminderLog {
  return {
    id: row.id,
    reminderId: row.reminder_id,
    sentAt: row.sent_at,
    status: row.status,
    errorMessage: row.error_message,
  };
}

// Create a log entry
export function create(reminderId: number, status: 'sent' | 'failed', errorMessage?: string): RecurringReminderLog {
  const result = db.prepare(`
    INSERT INTO recurring_reminder_logs (reminder_id, status, error_message)
    VALUES (?, ?, ?)
  `).run(reminderId, status, errorMessage || null);

  const logId = result.lastInsertRowid as number;
  const row = db.prepare('SELECT * FROM recurring_reminder_logs WHERE id = ?').get(logId) as RecurringReminderLogRow;
  return rowToLog(row);
}

// Find logs by reminder ID
export function findByReminderId(reminderId: number, limit: number = 50): RecurringReminderLog[] {
  const rows = db.prepare(`
    SELECT * FROM recurring_reminder_logs
    WHERE reminder_id = ?
    ORDER BY sent_at DESC
    LIMIT ?
  `).all(reminderId, limit) as RecurringReminderLogRow[];

  return rows.map(rowToLog);
}

// Delete logs by reminder ID
export function deleteByReminderId(reminderId: number): void {
  db.prepare('DELETE FROM recurring_reminder_logs WHERE reminder_id = ?').run(reminderId);
}
