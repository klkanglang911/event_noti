import api from './api';
import type {
  RecurringReminder,
  CreateRecurringReminderInput,
  UpdateRecurringReminderInput,
  RecurringReminderLog,
  ReminderCategory,
} from '@event-noti/shared';

interface RecurringReminderListResponse {
  data: RecurringReminder[];
  success: boolean;
}

interface RecurringReminderResponse {
  data: RecurringReminder;
  success: boolean;
}

interface RecurringReminderLogListResponse {
  data: RecurringReminderLog[];
  success: boolean;
}

// Get all recurring reminders
export async function getRecurringReminders(category?: ReminderCategory): Promise<RecurringReminder[]> {
  const params = category ? { category } : {};
  const response = await api.get<RecurringReminderListResponse>('/recurring-reminders', { params });
  return response.data.data;
}

// Get recurring reminder by ID
export async function getRecurringReminder(id: number): Promise<RecurringReminder> {
  const response = await api.get<RecurringReminderResponse>(`/recurring-reminders/${id}`);
  return response.data.data;
}

// Create recurring reminder
export async function createRecurringReminder(input: CreateRecurringReminderInput): Promise<RecurringReminder> {
  const response = await api.post<RecurringReminderResponse>('/recurring-reminders', input);
  return response.data.data;
}

// Update recurring reminder
export async function updateRecurringReminder(id: number, input: UpdateRecurringReminderInput): Promise<RecurringReminder> {
  const response = await api.put<RecurringReminderResponse>(`/recurring-reminders/${id}`, input);
  return response.data.data;
}

// Delete recurring reminder
export async function deleteRecurringReminder(id: number): Promise<void> {
  await api.delete(`/recurring-reminders/${id}`);
}

// Pause recurring reminder
export async function pauseRecurringReminder(id: number): Promise<RecurringReminder> {
  const response = await api.post<RecurringReminderResponse>(`/recurring-reminders/${id}/pause`);
  return response.data.data;
}

// Resume recurring reminder
export async function resumeRecurringReminder(id: number): Promise<RecurringReminder> {
  const response = await api.post<RecurringReminderResponse>(`/recurring-reminders/${id}/resume`);
  return response.data.data;
}

// Get reminder logs
export async function getRecurringReminderLogs(id: number, limit?: number): Promise<RecurringReminderLog[]> {
  const params = limit ? { limit } : {};
  const response = await api.get<RecurringReminderLogListResponse>(`/recurring-reminders/${id}/logs`, { params });
  return response.data.data;
}
