import * as calendarSubscriptionModel from '../models/calendarSubscriptionModel.ts';
import * as groupModel from '../models/groupModel.ts';
import type { CalendarSubscription, UpdateCalendarSubscriptionInput } from '@event-noti/shared';

// Get current user's subscription (auto-create default disabled record if missing)
export function getSubscription(userId: number): CalendarSubscription {
  return calendarSubscriptionModel.upsert(userId, {});
}

// Update (upsert) current user's subscription
export function updateSubscription(
  userId: number,
  input: UpdateCalendarSubscriptionInput
): CalendarSubscription {
  // Validate group belongs to user if provided
  if (input.groupId) {
    if (!groupModel.belongsToUser(input.groupId, userId)) {
      throw new Error('分组不存在');
    }
  }

  // Validate advance days
  if (input.advanceDays !== undefined && (input.advanceDays < 0 || input.advanceDays > 365)) {
    throw new Error('提前天数必须在 0 到 365 之间');
  }

  return calendarSubscriptionModel.upsert(userId, input);
}

// Check if subscription belongs to user
export function subscriptionBelongsToUser(id: number, userId: number): boolean {
  return calendarSubscriptionModel.belongsToUser(id, userId);
}
