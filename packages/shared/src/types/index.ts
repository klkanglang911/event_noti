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
  role?: 'admin' | 'user';
  isActive?: boolean;
}

// Event types
export type MessageFormat = 'text' | 'markdown';

export interface Event {
  id: number;
  title: string;
  content: string | null;
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
  targetDate: string;
  targetTime?: string; // HH:MM, defaults to 09:00
  remindDays?: number; // Deprecated: now using smart notification rules
  messageFormat?: MessageFormat; // defaults to 'text'
  groupId?: number;
}

export interface UpdateEventInput {
  title?: string;
  content?: string;
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
