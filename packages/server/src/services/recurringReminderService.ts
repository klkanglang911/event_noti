import * as recurringReminderModel from '../models/recurringReminderModel.ts';
import * as recurringReminderLogModel from '../models/recurringReminderLogModel.ts';
import * as groupModel from '../models/groupModel.ts';
import type {
  RecurringReminder,
  CreateRecurringReminderInput,
  UpdateRecurringReminderInput,
  ReminderCategory,
  RecurringReminderLog,
} from '@event-noti/shared';

// Get recurring reminders for user
export function getRecurringRemindersByUser(userId: number, category?: ReminderCategory): RecurringReminder[] {
  return recurringReminderModel.findByUserId(userId, category);
}

// Get recurring reminder by ID
export function getRecurringReminderById(id: number): RecurringReminder | null {
  return recurringReminderModel.findById(id);
}

// Create recurring reminder
export function createRecurringReminder(userId: number, input: CreateRecurringReminderInput): RecurringReminder {
  // Validate group belongs to user if provided
  if (input.groupId) {
    if (!groupModel.belongsToUser(input.groupId, userId)) {
      throw new Error('分组不存在');
    }
  }

  // Validate interval
  if (input.intervalMinutes < 1 || input.intervalMinutes > 10080) {
    throw new Error('循环间隔必须在 1 到 10080 分钟之间');
  }

  return recurringReminderModel.create(userId, input);
}

// Update recurring reminder
export function updateRecurringReminder(
  id: number,
  userId: number,
  input: UpdateRecurringReminderInput
): RecurringReminder | null {
  const reminder = recurringReminderModel.findById(id);

  if (!reminder || reminder.userId !== userId) {
    return null;
  }

  // Validate group belongs to user if provided
  if (input.groupId) {
    if (!groupModel.belongsToUser(input.groupId, userId)) {
      throw new Error('分组不存在');
    }
  }

  // Validate interval if provided
  if (input.intervalMinutes !== undefined && (input.intervalMinutes < 1 || input.intervalMinutes > 10080)) {
    throw new Error('循环间隔必须在 1 到 10080 分钟之间');
  }

  return recurringReminderModel.update(id, input);
}

// Delete recurring reminder
export function deleteRecurringReminder(id: number, userId: number): boolean {
  const reminder = recurringReminderModel.findById(id);

  if (!reminder || reminder.userId !== userId) {
    return false;
  }

  return recurringReminderModel.remove(id);
}

// Pause recurring reminder
export function pauseRecurringReminder(id: number, userId: number): RecurringReminder | null {
  const reminder = recurringReminderModel.findById(id);

  if (!reminder || reminder.userId !== userId) {
    return null;
  }

  if (reminder.status !== 'active') {
    throw new Error('只能暂停运行中的提醒');
  }

  recurringReminderModel.updateStatus(id, 'paused');
  return recurringReminderModel.findById(id);
}

// Resume recurring reminder
export function resumeRecurringReminder(id: number, userId: number): RecurringReminder | null {
  const reminder = recurringReminderModel.findById(id);

  if (!reminder || reminder.userId !== userId) {
    return null;
  }

  if (reminder.status !== 'paused') {
    throw new Error('只能恢复已暂停的提醒');
  }

  recurringReminderModel.updateStatus(id, 'active');
  return recurringReminderModel.findById(id);
}

// Get reminder logs
export function getRecurringReminderLogs(id: number, userId: number, limit?: number): RecurringReminderLog[] {
  const reminder = recurringReminderModel.findById(id);

  if (!reminder || reminder.userId !== userId) {
    return [];
  }

  return recurringReminderLogModel.findByReminderId(id, limit);
}

// Check if recurring reminder belongs to user
export function recurringReminderBelongsToUser(id: number, userId: number): boolean {
  return recurringReminderModel.belongsToUser(id, userId);
}
