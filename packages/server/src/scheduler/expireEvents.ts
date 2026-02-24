import cron from 'node-cron';
import * as eventModel from '../models/eventModel.ts';
import * as settingsService from '../services/settingsService.ts';

// Configuration from environment
const EXPIRE_CRON = process.env.EXPIRE_CRON || '5 9 * * *'; // Default: 9:05 AM daily (after notifications)

// Track if scheduler is running
let expireTask: cron.ScheduledTask | null = null;

// Mark expired events
function processExpiredEvents(): void {
  console.log(`[ExpireEvents] Checking for expired events`);

  const expiredCount = eventModel.markExpired();

  if (expiredCount > 0) {
    console.log(`[ExpireEvents] Marked ${expiredCount} events as expired`);
  } else {
    console.log(`[ExpireEvents] No events to expire`);
  }
}

// Start the expire events scheduler
export function startExpireScheduler(): void {
  const timezone = settingsService.getTimezone();

  console.log(`[ExpireEvents] Starting expire events scheduler`);
  console.log(`[ExpireEvents] Schedule: ${EXPIRE_CRON}`);
  console.log(`[ExpireEvents] Timezone: ${timezone}`);

  // Validate cron expression
  if (!cron.validate(EXPIRE_CRON)) {
    console.error(`[ExpireEvents] Invalid EXPIRE_CRON: ${EXPIRE_CRON}`);
    return;
  }

  // Prevent duplicate tasks when restarting scheduler
  if (expireTask) {
    expireTask.stop();
    expireTask = null;
  }

  // Schedule expire job
  expireTask = cron.schedule(
    EXPIRE_CRON,
    () => {
      console.log(`[ExpireEvents] Expire job triggered`);
      try {
        processExpiredEvents();
      } catch (error) {
        console.error(`[ExpireEvents] Expire job error:`, error);
      }
    },
    { timezone }
  );

  console.log(`[ExpireEvents] Scheduler started successfully`);
}

// Stop the expire scheduler
export function stopExpireScheduler(): void {
  if (expireTask) {
    expireTask.stop();
    expireTask = null;
  }

  console.log(`[ExpireEvents] Scheduler stopped`);
}

// Run manually (for testing)
export function runExpireManually(): void {
  console.log(`[ExpireEvents] Manual trigger`);
  processExpiredEvents();
}
