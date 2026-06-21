import { CALENDAR_EVENT_OPTIONS, SOLAR_TERM_OPTIONS, TRADITIONAL_FESTIVAL_OPTIONS } from './constants';
import type {
  CalendarEventOption,
  CalendarEventType,
  SolarTermOption,
  TraditionalFestivalOption,
} from './types';

const lunarDateFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
  timeZone: 'UTC',
  month: 'numeric',
  day: 'numeric',
});

interface LunarDateParts {
  month: number;
  day: number;
  isLeapMonth: boolean;
}

function parseIsoDateToUtc(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getTodayIsoDate(): string {
  return formatUtcDate(new Date());
}

export function addDaysToIsoDate(dateStr: string, days: number): string {
  const date = parseIsoDateToUtc(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcDate(date);
}

function getLunarDateParts(date: Date): LunarDateParts {
  const parts = lunarDateFormatter.formatToParts(date);
  const monthValue = parts.find((part) => part.type === 'month')?.value || '';
  const dayValue = parts.find((part) => part.type === 'day')?.value || '';

  return {
    month: parseInt(monthValue, 10),
    day: parseInt(dayValue, 10),
    isLeapMonth: /闰|bis/i.test(monthValue),
  };
}

function findLunarDateInGregorianYear(year: number, lunarMonth: number, lunarDay: number): string | null {
  const date = new Date(Date.UTC(year, 0, 1));

  while (date.getUTCFullYear() === year) {
    const lunar = getLunarDateParts(date);

    if (!lunar.isLeapMonth && lunar.month === lunarMonth && lunar.day === lunarDay) {
      return formatUtcDate(date);
    }

    date.setUTCDate(date.getUTCDate() + 1);
  }

  return null;
}

function getTraditionalFestivalDate(option: TraditionalFestivalOption, year: number): string | null {
  if (option.special === 'lunar_new_year_eve') {
    const springFestivalDate = findLunarDateInGregorianYear(year, 1, 1);
    return springFestivalDate ? addDaysToIsoDate(springFestivalDate, -1) : null;
  }

  if (option.lunarMonth === undefined || option.lunarDay === undefined) {
    return null;
  }

  return findLunarDateInGregorianYear(year, option.lunarMonth, option.lunarDay);
}

function getSolarTermDate(option: SolarTermOption, year: number): string {
  const yearInCentury = year % 100;
  const day =
    Math.floor(yearInCentury * 0.2422 + option.coefficient) -
    Math.floor((yearInCentury - 1) / 4);

  return formatUtcDate(new Date(Date.UTC(year, option.month - 1, day)));
}

export function isCalendarEventType(value: string): value is CalendarEventType {
  return value === 'traditional_festival' || value === 'solar_term';
}

export function getCalendarEventOption(
  eventType: CalendarEventType,
  calendarKey: string
): CalendarEventOption | undefined {
  const options =
    eventType === 'traditional_festival' ? TRADITIONAL_FESTIVAL_OPTIONS : SOLAR_TERM_OPTIONS;

  return options.find((option) => option.key === calendarKey) as CalendarEventOption | undefined;
}

function getCalendarEventDateInYear(
  eventType: CalendarEventType,
  calendarKey: string,
  year: number
): string | null {
  const option = getCalendarEventOption(eventType, calendarKey);

  if (!option) {
    return null;
  }

  if (option.eventType === 'traditional_festival') {
    return getTraditionalFestivalDate(option, year);
  }

  return getSolarTermDate(option, year);
}

export function getNextCalendarEventDate(
  eventType: CalendarEventType,
  calendarKey: string,
  fromDate: string = getTodayIsoDate()
): string {
  const fromYear = parseIsoDateToUtc(fromDate).getUTCFullYear();

  for (let year = fromYear; year <= fromYear + 5; year++) {
    const eventDate = getCalendarEventDateInYear(eventType, calendarKey, year);

    if (eventDate && eventDate >= fromDate) {
      return eventDate;
    }
  }

  throw new Error('无法计算节日或节气日期');
}

export function getCalendarReminderDate(
  targetDate: string,
  advanceDays: number,
  fromDate: string = getTodayIsoDate()
): string {
  const scheduledDate = addDaysToIsoDate(targetDate, -advanceDays);
  return scheduledDate < fromDate ? fromDate : scheduledDate;
}

export interface UpcomingCalendarEvent {
  key: string;
  name: string;
  eventType: CalendarEventType;
  date: string;
}

// 取距 fromDate 最近的下一个节日或节气（遍历全部节日 + 节气）。
// 可传 excludeKey 排除指定项（如当前正在提醒的节日/节气，避免预告到自己）。
export function getNextUpcomingCalendarEvent(
  fromDate: string = getTodayIsoDate(),
  excludeKey?: string
): UpcomingCalendarEvent | null {
  let best: UpcomingCalendarEvent | null = null;

  for (const option of CALENDAR_EVENT_OPTIONS) {
    if (option.key === excludeKey) continue;
    try {
      const date = getNextCalendarEventDate(option.eventType, option.key, fromDate);
      if (!best || date < best.date) {
        best = { key: option.key, name: option.name, eventType: option.eventType, date };
      }
    } catch {
      // 该节日/节气连续 5 年内算不出，跳过
    }
  }

  return best;
}
