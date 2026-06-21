// User types
export interface User {
  id: number;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  displayName: string;
  role?: 'admin' | 'user';
}

export interface UpdateUserInput {
  displayName?: string;
  password?: string;
  role?: 'admin' | 'user';
  isActive?: boolean;
}

// Event types
export type MessageFormat = 'text' | 'markdown';
export type EventType = 'custom' | 'traditional_festival' | 'solar_term';
export type CalendarEventType = Exclude<EventType, 'custom'>;
export type LunarFestivalSpecial = 'lunar_new_year_eve';

export interface CalendarEventOptionBase {
  key: string;
  name: string;
  eventType: CalendarEventType;
}

export interface TraditionalFestivalOption extends CalendarEventOptionBase {
  eventType: 'traditional_festival';
  lunarMonth?: number;
  lunarDay?: number;
  special?: LunarFestivalSpecial;
}

export interface SolarTermOption extends CalendarEventOptionBase {
  eventType: 'solar_term';
  month: number;
  coefficient: number;
}

export type CalendarEventOption = TraditionalFestivalOption | SolarTermOption;

export interface Event {
  id: number;
  title: string;
  content: string | null;
  eventType: EventType;
  calendarKey: string | null;
  targetDate: string; // YYYY-MM-DD
  targetTime: string; // HH:MM
  remindDays: number;
  messageFormat: MessageFormat;
  groupId: number | null;
  userId: number;
  status: 'active' | 'expired' | 'completed';
  createdAt: string;
  updatedAt: string;
  // Computed/joined fields
  group?: Group;
  daysRemaining?: number;
}

export interface CreateEventInput {
  title: string;
  content?: string;
  eventType?: EventType; // defaults to 'custom'
  calendarKey?: string;
  targetDate?: string;
  targetTime?: string; // HH:MM, defaults to 09:00
  remindDays?: number; // For calendar events, days before target date to notify
  messageFormat?: MessageFormat; // defaults to 'text'
  groupId?: number;
}

export interface UpdateEventInput {
  title?: string;
  content?: string;
  eventType?: EventType;
  calendarKey?: string | null;
  targetDate?: string;
  targetTime?: string;
  remindDays?: number;
  messageFormat?: MessageFormat;
  groupId?: number | null;
  status?: 'active' | 'expired' | 'completed';
}

// Group types
export interface Group {
  id: number;
  name: string;
  color: string;
  webhookId: number | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  webhook?: Webhook;
  eventCount?: number;
}

export interface CreateGroupInput {
  name: string;
  color?: string;
  webhookId?: number;
}

export interface UpdateGroupInput {
  name?: string;
  color?: string;
  webhookId?: number | null;
}

// Webhook types
export interface Webhook {
  id: number;
  name: string;
  url: string;
  isDefault: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  isDefault?: boolean;
}

export interface UpdateWebhookInput {
  name?: string;
  url?: string;
  isDefault?: boolean;
}

// Notification types
export interface Notification {
  id: number;
  eventId: number;
  scheduledDate: string;
  scheduledTime: string; // HH:MM
  sentAt: string | null;
  status: 'pending' | 'sent' | 'failed';
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  // Joined fields
  event?: Event;
}

// Auth types
export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: true;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
  success: false;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: true;
}

// Settings types
export interface SystemSettings {
  timezone: string;
  currentTime?: string;
}

export interface UpdateTimezoneInput {
  timezone: string;
}

// Recurring Reminder types
export type ReminderCategory = 'stand' | 'water' | 'eye' | 'medicine' | 'custom';
export type ReminderStatus = 'active' | 'paused' | 'disabled';

export interface RecurringReminder {
  id: number;
  userId: number;
  title: string;
  content: string | null;
  category: ReminderCategory;
  intervalMinutes: number;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  workdaysOnly: boolean;
  groupId: number | null;
  messageFormat: MessageFormat;
  status: ReminderStatus;
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  group?: Group;
}

export interface CreateRecurringReminderInput {
  title: string;
  content?: string;
  category?: ReminderCategory;
  intervalMinutes: number;
  startTime?: string; // HH:MM, defaults to '09:00'
  endTime?: string; // HH:MM, defaults to '18:00'
  workdaysOnly?: boolean; // defaults to true
  groupId?: number;
  messageFormat?: MessageFormat;
}

export interface UpdateRecurringReminderInput {
  title?: string;
  content?: string;
  category?: ReminderCategory;
  intervalMinutes?: number;
  startTime?: string;
  endTime?: string;
  workdaysOnly?: boolean;
  groupId?: number | null;
  messageFormat?: MessageFormat;
  status?: ReminderStatus;
}

export interface RecurringReminderLog {
  id: number;
  reminderId: number;
  sentAt: string;
  status: 'sent' | 'failed';
  errorMessage: string | null;
}

export interface ReminderPreset {
  name: string;
  category: ReminderCategory;
  intervalMinutes: number;
  startTime: string;
  endTime: string;
  workdaysOnly: boolean;
  title: string;
  content: string;
  icon: string;
}
