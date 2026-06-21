import cron from 'node-cron';
import * as eventModel from '../models/eventModel.ts';
import * as settingsService from '../services/settingsService.ts';
import {
  addDaysToIsoDate,
  getNextCalendarEventDate,
  isCalendarEventType,
} from '@event-noti/shared';

// 节日/节气事件年度续期调度。
// 默认每天 09:00 运行，**必须早于 EXPIRE_CRON（默认 5 9 * * * 即 09:05）**，
// 否则今年已过的节日/节气事件会先被 expireEvents 标记为 expired。
const RENEW_CRON = process.env.RENEW_CRON || '0 9 * * *';

// Track if scheduler is running
let renewTask: cron.ScheduledTask | null = null;

// 把"今年节日/节气已过"的事件续期到下一年
function processRenewals(): void {
  const today = settingsService.getTodayInTimezone();
  const events = eventModel.findCalendarEventsToRenew();

  if (events.length === 0) {
    return;
  }

  console.log(`[RenewCalendar] Found ${events.length} calendar event(s) to renew (as of ${today})`);

  let renewed = 0;
  let skipped = 0;

  for (const event of events) {
    // 仅处理节日/节气类型，且必须有 calendarKey
    if (!isCalendarEventType(event.eventType) || !event.calendarKey) {
      skipped++;
      continue;
    }

    try {
      // 从 target_date 的下一天起查下一个同节日/节气日期（跳过今年，取下一年）
      const fromDate = addDaysToIsoDate(event.targetDate, 1);
      const nextTargetDate = getNextCalendarEventDate(event.eventType, event.calendarKey, fromDate);

      eventModel.renewCalendarEvent(event.id, nextTargetDate);
      renewed++;
      console.log(
        `[RenewCalendar] Event ${event.id} "${event.title}" renewed: ${event.targetDate} -> ${nextTargetDate}`
      );
    } catch (error) {
      // getNextCalendarEventDate 连续 5 年算不出时抛异常；跳过该事件，
      // 它随后会被 expireEvents 正常标记过期，不影响其它事件续期。
      skipped++;
      console.warn(
        `[RenewCalendar] Failed to renew event ${event.id} "${event.title}":`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log(`[RenewCalendar] Renewal complete: ${renewed} renewed, ${skipped} skipped`);
}

// Start the renew scheduler
export function startRenewScheduler(): void {
  const timezone = settingsService.getTimezone();

  console.log(`[RenewCalendar] Starting calendar event renewal scheduler`);
  console.log(`[RenewCalendar] Schedule: ${RENEW_CRON}`);
  console.log(`[RenewCalendar] Timezone: ${timezone}`);

  // Validate cron expression
  if (!cron.validate(RENEW_CRON)) {
    console.error(`[RenewCalendar] Invalid RENEW_CRON: ${RENEW_CRON}`);
    return;
  }

  // Prevent duplicate tasks when restarting scheduler
  if (renewTask) {
    renewTask.stop();
    renewTask = null;
  }

  // Schedule renew job
  renewTask = cron.schedule(
    RENEW_CRON,
    () => {
      console.log(`[RenewCalendar] Renew job triggered`);
      try {
        processRenewals();
      } catch (error) {
        console.error(`[RenewCalendar] Renew job error:`, error);
      }
    },
    { timezone }
  );

  console.log(`[RenewCalendar] Scheduler started successfully`);
}

// Stop the renew scheduler
export function stopRenewScheduler(): void {
  if (renewTask) {
    renewTask.stop();
    renewTask = null;
  }

  console.log(`[RenewCalendar] Scheduler stopped`);
}

// Run manually (for testing)
export function runRenewManually(): void {
  console.log(`[RenewCalendar] Manual trigger`);
  processRenewals();
}
