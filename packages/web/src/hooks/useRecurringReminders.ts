import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as recurringReminderService from '@/services/recurringReminderService';
import type {
  CreateRecurringReminderInput,
  UpdateRecurringReminderInput,
  ReminderCategory,
} from '@event-noti/shared';

// Query keys
export const recurringReminderKeys = {
  all: ['recurring-reminders'] as const,
  list: (category?: ReminderCategory) => [...recurringReminderKeys.all, 'list', category] as const,
  detail: (id: number) => [...recurringReminderKeys.all, 'detail', id] as const,
  logs: (id: number) => [...recurringReminderKeys.all, 'logs', id] as const,
};

// Get recurring reminders list
export function useRecurringReminders(category?: ReminderCategory) {
  return useQuery({
    queryKey: recurringReminderKeys.list(category),
    queryFn: () => recurringReminderService.getRecurringReminders(category),
  });
}

// Get single recurring reminder
export function useRecurringReminder(id: number) {
  return useQuery({
    queryKey: recurringReminderKeys.detail(id),
    queryFn: () => recurringReminderService.getRecurringReminder(id),
    enabled: !!id,
  });
}

// Create recurring reminder
export function useCreateRecurringReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecurringReminderInput) =>
      recurringReminderService.createRecurringReminder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringReminderKeys.all });
    },
  });
}

// Update recurring reminder
export function useUpdateRecurringReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateRecurringReminderInput }) =>
      recurringReminderService.updateRecurringReminder(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringReminderKeys.all });
    },
  });
}

// Delete recurring reminder
export function useDeleteRecurringReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => recurringReminderService.deleteRecurringReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringReminderKeys.all });
    },
  });
}

// Pause recurring reminder
export function usePauseRecurringReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => recurringReminderService.pauseRecurringReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringReminderKeys.all });
    },
  });
}

// Resume recurring reminder
export function useResumeRecurringReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => recurringReminderService.resumeRecurringReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringReminderKeys.all });
    },
  });
}

// Get reminder logs
export function useRecurringReminderLogs(id: number, limit?: number) {
  return useQuery({
    queryKey: recurringReminderKeys.logs(id),
    queryFn: () => recurringReminderService.getRecurringReminderLogs(id, limit),
    enabled: !!id,
  });
}
