// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Event status
export const EVENT_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  COMPLETED: 'completed',
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

// Event types
export const EVENT_TYPES = {
  CUSTOM: 'custom',
  TRADITIONAL_FESTIVAL: 'traditional_festival',
  SOLAR_TERM: 'solar_term',
} as const;

export type EventTypeValue = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export const EVENT_TYPE_LABELS: Record<EventTypeValue, string> = {
  custom: '普通日期',
  traditional_festival: '传统节日',
  solar_term: '二十四节气',
};

// Chinese traditional festivals based on the lunar calendar.
export const TRADITIONAL_FESTIVAL_OPTIONS = [
  { key: 'spring_festival', name: '春节', eventType: EVENT_TYPES.TRADITIONAL_FESTIVAL, lunarMonth: 1, lunarDay: 1 },
  { key: 'lantern_festival', name: '元宵节', eventType: EVENT_TYPES.TRADITIONAL_FESTIVAL, lunarMonth: 1, lunarDay: 15 },
  { key: 'dragon_boat', name: '端午节', eventType: EVENT_TYPES.TRADITIONAL_FESTIVAL, lunarMonth: 5, lunarDay: 5 },
  { key: 'qixi', name: '七夕节', eventType: EVENT_TYPES.TRADITIONAL_FESTIVAL, lunarMonth: 7, lunarDay: 7 },
  { key: 'ghost_festival', name: '中元节', eventType: EVENT_TYPES.TRADITIONAL_FESTIVAL, lunarMonth: 7, lunarDay: 15 },
  { key: 'mid_autumn', name: '中秋节', eventType: EVENT_TYPES.TRADITIONAL_FESTIVAL, lunarMonth: 8, lunarDay: 15 },
  { key: 'double_ninth', name: '重阳节', eventType: EVENT_TYPES.TRADITIONAL_FESTIVAL, lunarMonth: 9, lunarDay: 9 },
  { key: 'laba', name: '腊八节', eventType: EVENT_TYPES.TRADITIONAL_FESTIVAL, lunarMonth: 12, lunarDay: 8 },
  { key: 'new_years_eve', name: '除夕', eventType: EVENT_TYPES.TRADITIONAL_FESTIVAL, special: 'lunar_new_year_eve' },
] as const;

// 24 solar terms. Coefficients use the common 21st-century approximation formula.
export const SOLAR_TERM_OPTIONS = [
  { key: 'xiaohan', name: '小寒', eventType: EVENT_TYPES.SOLAR_TERM, month: 1, coefficient: 5.4055 },
  { key: 'dahan', name: '大寒', eventType: EVENT_TYPES.SOLAR_TERM, month: 1, coefficient: 20.12 },
  { key: 'lichun', name: '立春', eventType: EVENT_TYPES.SOLAR_TERM, month: 2, coefficient: 3.87 },
  { key: 'yushui', name: '雨水', eventType: EVENT_TYPES.SOLAR_TERM, month: 2, coefficient: 18.73 },
  { key: 'jingzhe', name: '惊蛰', eventType: EVENT_TYPES.SOLAR_TERM, month: 3, coefficient: 5.63 },
  { key: 'chunfen', name: '春分', eventType: EVENT_TYPES.SOLAR_TERM, month: 3, coefficient: 20.646 },
  { key: 'qingming', name: '清明', eventType: EVENT_TYPES.SOLAR_TERM, month: 4, coefficient: 4.81 },
  { key: 'guyu', name: '谷雨', eventType: EVENT_TYPES.SOLAR_TERM, month: 4, coefficient: 20.1 },
  { key: 'lixia', name: '立夏', eventType: EVENT_TYPES.SOLAR_TERM, month: 5, coefficient: 5.52 },
  { key: 'xiaoman', name: '小满', eventType: EVENT_TYPES.SOLAR_TERM, month: 5, coefficient: 21.04 },
  { key: 'mangzhong', name: '芒种', eventType: EVENT_TYPES.SOLAR_TERM, month: 6, coefficient: 5.678 },
  { key: 'xiazhi', name: '夏至', eventType: EVENT_TYPES.SOLAR_TERM, month: 6, coefficient: 21.37 },
  { key: 'xiaoshu', name: '小暑', eventType: EVENT_TYPES.SOLAR_TERM, month: 7, coefficient: 7.108 },
  { key: 'dashu', name: '大暑', eventType: EVENT_TYPES.SOLAR_TERM, month: 7, coefficient: 22.83 },
  { key: 'liqiu', name: '立秋', eventType: EVENT_TYPES.SOLAR_TERM, month: 8, coefficient: 7.5 },
  { key: 'chushu', name: '处暑', eventType: EVENT_TYPES.SOLAR_TERM, month: 8, coefficient: 23.13 },
  { key: 'bailu', name: '白露', eventType: EVENT_TYPES.SOLAR_TERM, month: 9, coefficient: 7.646 },
  { key: 'qiufen', name: '秋分', eventType: EVENT_TYPES.SOLAR_TERM, month: 9, coefficient: 23.042 },
  { key: 'hanlu', name: '寒露', eventType: EVENT_TYPES.SOLAR_TERM, month: 10, coefficient: 8.318 },
  { key: 'shuangjiang', name: '霜降', eventType: EVENT_TYPES.SOLAR_TERM, month: 10, coefficient: 23.438 },
  { key: 'lidong', name: '立冬', eventType: EVENT_TYPES.SOLAR_TERM, month: 11, coefficient: 7.438 },
  { key: 'xiaoxue', name: '小雪', eventType: EVENT_TYPES.SOLAR_TERM, month: 11, coefficient: 22.36 },
  { key: 'daxue', name: '大雪', eventType: EVENT_TYPES.SOLAR_TERM, month: 12, coefficient: 7.18 },
  { key: 'dongzhi', name: '冬至', eventType: EVENT_TYPES.SOLAR_TERM, month: 12, coefficient: 21.94 },
] as const;

export const CALENDAR_EVENT_OPTIONS = [
  ...TRADITIONAL_FESTIVAL_OPTIONS,
  ...SOLAR_TERM_OPTIONS,
] as const;

// Notification status
export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

// API error codes
export const ERROR_CODES = {
  // Auth errors
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Permission errors
  FORBIDDEN: 'FORBIDDEN',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  WEBHOOK_FAILED: 'WEBHOOK_FAILED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Default values
export const DEFAULTS = {
  REMIND_DAYS: 7,
  GROUP_COLOR: '#3B82F6',
  PAGE_SIZE: 20,
  MAX_RETRY_COUNT: 3,
} as const;

// Preset colors for groups
export const GROUP_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
] as const;

// Recurring Reminder categories
export const REMINDER_CATEGORIES = {
  STAND: 'stand',
  WATER: 'water',
  EYE: 'eye',
  MEDICINE: 'medicine',
  CUSTOM: 'custom',
} as const;

export const REMINDER_CATEGORY_LABELS: Record<string, string> = {
  stand: '站立提醒',
  water: '喝水提醒',
  eye: '护眼提醒',
  medicine: '吃药提醒',
  custom: '自定义',
};

export const REMINDER_CATEGORY_ICONS: Record<string, string> = {
  stand: '🪑',
  water: '💧',
  eye: '👁️',
  medicine: '💊',
  custom: '🔔',
};

// Preset reminder templates
export const REMINDER_PRESETS = [
  {
    name: '久坐站立',
    category: 'stand' as const,
    intervalMinutes: 60,
    startTime: '09:00',
    endTime: '18:00',
    workdaysOnly: true,
    title: '站立活动一下',
    content: '久坐对身体不好，该站起来走动走动了！',
    icon: '🪑',
  },
  {
    name: '喝水提醒',
    category: 'water' as const,
    intervalMinutes: 45,
    startTime: '08:00',
    endTime: '20:00',
    workdaysOnly: false,
    title: '该喝水了',
    content: '记得补充水分，保持身体健康！',
    icon: '💧',
  },
  {
    name: '20-20-20 护眼',
    category: 'eye' as const,
    intervalMinutes: 20,
    startTime: '09:00',
    endTime: '18:00',
    workdaysOnly: true,
    title: '眼睛休息一下',
    content: '看看 20 英尺（6 米）外的地方 20 秒，保护视力！',
    icon: '👁️',
  },
  {
    name: '上午吃药',
    category: 'medicine' as const,
    intervalMinutes: 1440, // 24小时 = 每天一次
    startTime: '09:00',
    endTime: '09:01',
    workdaysOnly: false,
    title: '上午吃药提醒',
    content: '别忘了吃上午的药！',
    icon: '💊',
  },
  {
    name: '下午吃药',
    category: 'medicine' as const,
    intervalMinutes: 1440,
    startTime: '15:00',
    endTime: '15:01',
    workdaysOnly: false,
    title: '下午吃药提醒',
    content: '别忘了吃下午的药！',
    icon: '💊',
  },
] as const;
