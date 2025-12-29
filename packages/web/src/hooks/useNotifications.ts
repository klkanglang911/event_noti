import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationService from '@/services/notificationService';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: { page?: number; status?: string }) =>
    [...notificationKeys.all, 'list', params] as const,
  stats: () => [...notificationKeys.all, 'stats'] as const,
};

// Get notifications list
export function useNotifications(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationService.getNotifications(params),
  });
}

// Get notification stats
export function useNotificationStats() {
  return useQuery({
    queryKey: notificationKeys.stats(),
    queryFn: () => notificationService.getNotificationStats(),
  });
}

// Retry notification
export function useRetryNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationService.retryNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
