import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as webhookService from '@/services/webhookService';
import type { CreateWebhookInput, UpdateWebhookInput } from '@event-noti/shared';

// Query keys
export const webhookKeys = {
  all: ['webhooks'] as const,
  list: () => [...webhookKeys.all, 'list'] as const,
  detail: (id: number) => [...webhookKeys.all, 'detail', id] as const,
};

// Get webhooks list
export function useWebhooks() {
  return useQuery({
    queryKey: webhookKeys.list(),
    queryFn: () => webhookService.getWebhooks(),
  });
}

// Get single webhook
export function useWebhook(id: number) {
  return useQuery({
    queryKey: webhookKeys.detail(id),
    queryFn: () => webhookService.getWebhook(id),
    enabled: !!id,
  });
}

// Create webhook
export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWebhookInput) => webhookService.createWebhook(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.all });
    },
  });
}

// Update webhook
export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateWebhookInput }) =>
      webhookService.updateWebhook(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.all });
    },
  });
}

// Delete webhook
export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => webhookService.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.all });
    },
  });
}

// Test webhook
export function useTestWebhook() {
  return useMutation({
    mutationFn: (id: number) => webhookService.testWebhook(id),
  });
}
