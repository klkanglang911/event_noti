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
