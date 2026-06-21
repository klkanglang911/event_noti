import cron from 'node-cron';
import * as notificationModel from '../models/notificationModel.ts';
import * as eventModel from '../models/eventModel.ts';
import * as groupModel from '../models/groupModel.ts';
import * as webhookModel from '../models/webhookModel.ts';
import * as webhookService from '../services/webhookService.ts';
import * as settingsService from '../services/settingsService.ts';
import * as recurringReminderModel from '../models/recurringReminderModel.ts';
import * as recurringReminderLogModel from '../models/recurringReminderLogModel.ts';
import { getNextUpcomingCalendarEvent, isCalendarEventType, type RecurringReminder } from '@event-noti/shared';

// Configuration from environment
// Check every minute for scheduled notifications
const NOTIFICATION_CRON = process.env.NOTIFICATION_CRON || '* * * * *'; // Default: every minute
const RETRY_CRON = process.env.RETRY_CRON || '*/5 * * * *'; // Default: every 5 minutes
const MAX_RETRIES = 3;

// Track if scheduler is running
let notificationTask: cron.ScheduledTask | null = null;
let retryTask: cron.ScheduledTask | null = null;

// Send a single notification
async function sendNotification(notificationId: number): Promise<boolean> {
  const notification = notificationModel.findById(notificationId);
  if (!notification) {
    console.error(`[Scheduler] Notification ${notificationId} not found`);
    return false;
  }

  const event = eventModel.findById(notification.eventId);
  if (!event) {
    console.error(`[Scheduler] Event ${notification.eventId} not found for notification ${notificationId}`);
    notificationModel.updateStatus(notificationId, 'failed', '关联事件不存在');
    return false;
  }

  // Find webhook URL (group webhook or default webhook)
  let webhookUrl: string | null = null;

  if (event.groupId) {
    const group = groupModel.findById(event.groupId);
    if (group?.webhookId) {
      const webhook = webhookModel.findById(group.webhookId);
      webhookUrl = webhook?.url || null;
    }
  }

  if (!webhookUrl) {
    const defaultWebhook = webhookModel.findDefault();
    webhookUrl = defaultWebhook?.url || null;
  }

  if (!webhookUrl) {
    console.warn(`[Scheduler] No webhook configured for notification ${notificationId}`);
    notificationModel.updateStatus(notificationId, 'failed', '未配置 Webhook');
    return false;
  }

  // Calculate days remaining using configured timezone
  const { date: todayStr } = settingsService.getCurrentTimeInTimezone();
  const today = new Date(todayStr);
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(event.targetDate);
  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // 节日/节气事件：在消息末尾附带「下一个节日/节气」预告（取最近 1 个，排除当前）
  let content = event.content || '';
  if (isCalendarEventType(event.eventType) && event.calendarKey) {
    const upcoming = getNextUpcomingCalendarEvent(todayStr, event.calendarKey);
    if (upcoming) {
      const nextDate = new Date(upcoming.date + 'T00:00:00');
      const daysToNext = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const typeLabel = upcoming.eventType === 'solar_term' ? '节气' : '节日';
      const dateLabel = `${nextDate.getMonth() + 1}月${nextDate.getDate()}日`;
      const preview = `📅 下一个${typeLabel}：${upcoming.name}（${dateLabel}，还有 ${daysToNext} 天）`;
      content = content ? `${content}\n\n${preview}` : preview;
    }
  }

  // Send notification with message format
  console.log(`[Scheduler] Sending notification ${notificationId} for event "${event.title}" (format: ${event.messageFormat})`);

  const result = await webhookService.sendNotification(
    webhookUrl,
    event.title,
    content,
    daysRemaining,
    event.messageFormat || 'text'
  );

  if (result.success) {
    notificationModel.updateStatus(notificationId, 'sent');
    console.log(`[Scheduler] Notification ${notificationId} sent successfully`);
    return true;
  } else {
    notificationModel.updateStatus(notificationId, 'failed', result.error);
    console.error(`[Scheduler] Notification ${notificationId} failed: ${result.error}`);
    return false;
  }
}

// Process notifications scheduled for current minute
async function processScheduledNotifications(): Promise<void> {
  // Use configured timezone for time calculation
  const { date: today, time: currentTime } = settingsService.getCurrentTimeInTimezone();
  const timezone = settingsService.getTimezone();

  console.log(`[Scheduler] Checking notifications for ${today} ${currentTime} (${timezone})`);

  const pendingNotifications = notificationModel.findPendingByDateTime(today, currentTime);

  if (pendingNotifications.length === 0) {
    return; // No notifications for this minute
  }

  console.log(`[Scheduler] Found ${pendingNotifications.length} notifications to send`);

  let successCount = 0;
  let failCount = 0;

  for (const notification of pendingNotifications) {
    const success = await sendNotification(notification.id);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay between notifications to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`[Scheduler] Processing complete: ${successCount} sent, ${failCount} failed`);
}

// Process all pending notifications for today (legacy function for compatibility)
async function processDailyNotifications(): Promise<void> {
  const { date: today } = settingsService.getCurrentTimeInTimezone();
  console.log(`[Scheduler] Processing all pending notifications for ${today}`);

  const pendingNotifications = notificationModel.findPendingByDate(today);
  console.log(`[Scheduler] Found ${pendingNotifications.length} pending notifications`);

  let successCount = 0;
  let failCount = 0;

  for (const notification of pendingNotifications) {
    const success = await sendNotification(notification.id);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay between notifications to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`[Scheduler] Daily processing complete: ${successCount} sent, ${failCount} failed`);
}

// Retry failed notifications
async function retryFailedNotifications(): Promise<void> {
  const failedNotifications = notificationModel.findFailedForRetry(MAX_RETRIES);

  if (failedNotifications.length === 0) {
    return;
  }

  console.log(`[Scheduler] Retrying ${failedNotifications.length} failed notifications`);

  let successCount = 0;

  for (const notification of failedNotifications) {
    // Reset to pending status before retry
    notificationModel.resetForRetry(notification.id);

    const success = await sendNotification(notification.id);
    if (success) {
      successCount++;
    }

    // Small delay between retries
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`[Scheduler] Retry complete: ${successCount}/${failedNotifications.length} recovered`);
}

// Check if current time is within the reminder's active time range
function isWithinTimeRange(startTime: string, endTime: string, currentTime: string): boolean {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const [currentH, currentM] = currentTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const currentMinutes = currentH * 60 + currentM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// Check if today is a workday (Monday to Friday)
function isWorkday(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  return day >= 1 && day <= 5;
}

// Check if enough time has passed since last send
function shouldSendNow(lastSentAt: string | null, intervalMinutes: number, currentTime: string): boolean {
  if (!lastSentAt) {
    return true; // Never sent before
  }

  const now = new Date();
  const lastSent = new Date(lastSentAt);
  const diffMs = now.getTime() - lastSent.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes >= intervalMinutes;
}

// Send recurring reminder notification
async function sendRecurringReminder(reminder: RecurringReminder): Promise<boolean> {
  // Find webhook URL (group webhook or default webhook)
  let webhookUrl: string | null = null;

  if (reminder.groupId) {
    const group = groupModel.findById(reminder.groupId);
    if (group?.webhookId) {
      const webhook = webhookModel.findById(group.webhookId);
      webhookUrl = webhook?.url || null;
    }
  }

  if (!webhookUrl) {
    const defaultWebhook = webhookModel.findDefault();
    webhookUrl = defaultWebhook?.url || null;
  }

  if (!webhookUrl) {
    console.warn(`[Scheduler] No webhook configured for recurring reminder ${reminder.id}`);
    recurringReminderLogModel.create(reminder.id, 'failed', '未配置 Webhook');
    return false;
  }

  // Build message content
  const content = reminder.content || reminder.title;

  console.log(`[Scheduler] Sending recurring reminder ${reminder.id}: "${reminder.title}" (format: ${reminder.messageFormat})`);

  const result = await webhookService.sendNotification(
    webhookUrl,
    reminder.title,
    content,
    0, // No days remaining for recurring reminders
    reminder.messageFormat || 'text'
  );

  if (result.success) {
    recurringReminderModel.updateLastSentAt(reminder.id);
    recurringReminderLogModel.create(reminder.id, 'sent');
    console.log(`[Scheduler] Recurring reminder ${reminder.id} sent successfully`);
    return true;
  } else {
    recurringReminderLogModel.create(reminder.id, 'failed', result.error);
    console.error(`[Scheduler] Recurring reminder ${reminder.id} failed: ${result.error}`);
    return false;
  }
}

// Process recurring reminders
async function processRecurringReminders(): Promise<void> {
  const { date: today, time: currentTime } = settingsService.getCurrentTimeInTimezone();

  const activeReminders = recurringReminderModel.findActive();

  if (activeReminders.length === 0) {
    return;
  }

  console.log(`[Scheduler] Checking ${activeReminders.length} recurring reminders`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const reminder of activeReminders) {
    // Check if within time range
    if (!isWithinTimeRange(reminder.startTime, reminder.endTime, currentTime)) {
      skipCount++;
      continue;
    }

    // Check workday filter
    if (reminder.workdaysOnly && !isWorkday(today)) {
      skipCount++;
      continue;
    }

    // Check interval
    if (!shouldSendNow(reminder.lastSentAt, reminder.intervalMinutes, currentTime)) {
      skipCount++;
      continue;
    }

    // Send notification
    const success = await sendRecurringReminder(reminder);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay between notifications
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (successCount > 0 || failCount > 0) {
    console.log(`[Scheduler] Recurring reminders: ${successCount} sent, ${failCount} failed, ${skipCount} skipped`);
  }
}

// Start the scheduler
export function startScheduler(): void {
  const timezone = settingsService.getTimezone();
  const { datetime } = settingsService.getCurrentTimeInTimezone();

  console.log(`[Scheduler] Starting notification scheduler`);
  console.log(`[Scheduler] Timezone: ${timezone}`);
  console.log(`[Scheduler] Current time: ${datetime}`);
  console.log(`[Scheduler] Notification schedule: ${NOTIFICATION_CRON} (every minute)`);
  console.log(`[Scheduler] Retry schedule: ${RETRY_CRON}`);

  // Validate cron expressions
  if (!cron.validate(NOTIFICATION_CRON)) {
    console.error(`[Scheduler] Invalid NOTIFICATION_CRON: ${NOTIFICATION_CRON}`);
    return;
  }

  if (!cron.validate(RETRY_CRON)) {
    console.error(`[Scheduler] Invalid RETRY_CRON: ${RETRY_CRON}`);
    return;
  }

  // Prevent duplicate tasks when restarting scheduler
  if (notificationTask) {
    notificationTask.stop();
    notificationTask = null;
  }
  if (retryTask) {
    retryTask.stop();
    retryTask = null;
  }

  // Schedule minute-level notification job
  notificationTask = cron.schedule(
    NOTIFICATION_CRON,
    async () => {
      try {
        await processScheduledNotifications();
        await processRecurringReminders();
      } catch (error) {
        console.error(`[Scheduler] Notification job error:`, error);
      }
    },
    { timezone }
  );

  // Schedule retry job
  retryTask = cron.schedule(
    RETRY_CRON,
    async () => {
      try {
        await retryFailedNotifications();
      } catch (error) {
        console.error(`[Scheduler] Retry job error:`, error);
      }
    },
    { timezone }
  );

  console.log(`[Scheduler] Scheduler started successfully`);
}

// Stop the scheduler
export function stopScheduler(): void {
  if (notificationTask) {
    notificationTask.stop();
    notificationTask = null;
  }

  if (retryTask) {
    retryTask.stop();
    retryTask = null;
  }

  console.log(`[Scheduler] Scheduler stopped`);
}

// Run daily notifications manually (for testing)
export async function runDailyNotificationsManually(): Promise<void> {
  console.log(`[Scheduler] Manual trigger: daily notifications`);
  await processDailyNotifications();
}

// Run retry manually (for testing)
export async function runRetryManually(): Promise<void> {
  console.log(`[Scheduler] Manual trigger: retry failed notifications`);
  await retryFailedNotifications();
}
