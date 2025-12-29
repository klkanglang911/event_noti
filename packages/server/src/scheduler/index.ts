import cron from 'node-cron';
import * as notificationModel from '../models/notificationModel.ts';
import * as eventModel from '../models/eventModel.ts';
import * as groupModel from '../models/groupModel.ts';
import * as webhookModel from '../models/webhookModel.ts';
import * as webhookService from '../services/webhookService.ts';
import * as settingsService from '../services/settingsService.ts';

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

  // Send notification with message format
  console.log(`[Scheduler] Sending notification ${notificationId} for event "${event.title}" (format: ${event.messageFormat})`);

  const result = await webhookService.sendNotification(
    webhookUrl,
    event.title,
    event.content || '',
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

  // Schedule minute-level notification job
  notificationTask = cron.schedule(NOTIFICATION_CRON, async () => {
    try {
      await processScheduledNotifications();
    } catch (error) {
      console.error(`[Scheduler] Notification job error:`, error);
    }
  });

  // Schedule retry job
  retryTask = cron.schedule(RETRY_CRON, async () => {
    try {
      await retryFailedNotifications();
    } catch (error) {
      console.error(`[Scheduler] Retry job error:`, error);
    }
  });

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
