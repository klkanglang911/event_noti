import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as calendarSubscriptionService from '@/services/calendarSubscriptionService';
import type { UpdateCalendarSubscriptionInput } from '@event-noti/shared';

// Query keys
export const calendarSubscriptionKeys = {
  all: ['calendar-subscription'] as const,
};

// Get current user's subscription
export function useCalendarSubscription() {
  return useQuery({
    queryKey: calendarSubscriptionKeys.all,
    queryFn: () => calendarSubscriptionService.getCalendarSubscription(),
  });
}

// Update (upsert) current user's subscription
export function useUpdateCalendarSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCalendarSubscriptionInput) =>
      calendarSubscriptionService.updateCalendarSubscription(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarSubscriptionKeys.all });
    },
  });
}
