import * as settingsModel from '../models/settingsModel.ts';
import type { SystemSettings } from '@event-noti/shared';

// Valid timezone list
const VALID_TIMEZONES = [
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Seoul',
  'Asia/Taipei',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

// Get all settings
export function getSettings(): SystemSettings {
  return {
    timezone: settingsModel.getTimezone(),
  };
}

// Get timezone
export function getTimezone(): string {
  return settingsModel.getTimezone();
}

// Update timezone
export function updateTimezone(timezone: string): SystemSettings {
  // Validate timezone
  if (!isValidTimezone(timezone)) {
    throw new Error('无效的时区');
  }

  settingsModel.setTimezone(timezone);
  return getSettings();
}

// Validate timezone
function isValidTimezone(timezone: string): boolean {
  // Check if it's in our predefined list or a valid IANA timezone
  if (VALID_TIMEZONES.includes(timezone)) {
    return true;
  }

  // Try to validate using Intl
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// Get current time in configured timezone
export function getCurrentTimeInTimezone(): { date: string; time: string; datetime: string } {
  const timezone = getTimezone();
  const now = new Date();

  // Format date as YYYY-MM-DD using sv-SE locale (ISO format)
  const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Format time - manually construct HH:MM to ensure zero-padding
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const date = dateFormatter.format(now);

  // Parse and re-format time to ensure HH:MM format with zero-padding
  const timeParts = timeFormatter.formatToParts(now);
  const hour = timeParts.find(p => p.type === 'hour')?.value || '00';
  const minute = timeParts.find(p => p.type === 'minute')?.value || '00';
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  const datetime = `${date} ${time}`;

  return { date, time, datetime };
}

// Get today's date in configured timezone (YYYY-MM-DD format)
export function getTodayInTimezone(): string {
  const { date } = getCurrentTimeInTimezone();
  return date;
}
