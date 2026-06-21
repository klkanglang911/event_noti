import api from './api';
import type { CalendarSubscription, UpdateCalendarSubscriptionInput } from '@event-noti/shared';

interface SubscriptionResponse {
  data: CalendarSubscription;
  success: boolean;
}

// Get current user's calendar subscription (auto-creates default if missing)
export async function getCalendarSubscription(): Promise<CalendarSubscription> {
  const response = await api.get<SubscriptionResponse>('/calendar-subscription');
  return response.data.data;
}

// Update (upsert) current user's calendar subscription
export async function updateCalendarSubscription(
  input: UpdateCalendarSubscriptionInput
): Promise<CalendarSubscription> {
  const response = await api.put<SubscriptionResponse>('/calendar-subscription', input);
  return response.data.data;
}
