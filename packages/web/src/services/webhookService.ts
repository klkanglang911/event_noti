import api from './api';
import type { Webhook, CreateWebhookInput, UpdateWebhookInput } from '@event-noti/shared';

interface WebhookListResponse {
  data: Webhook[];
  success: boolean;
}

interface WebhookResponse {
  data: Webhook;
  success: boolean;
}

// Get all webhooks
export async function getWebhooks(): Promise<Webhook[]> {
  const response = await api.get<WebhookListResponse>('/webhooks');
  return response.data.data;
}

// Get webhook by ID
export async function getWebhook(id: number): Promise<Webhook> {
  const response = await api.get<WebhookResponse>(`/webhooks/${id}`);
  return response.data.data;
}

// Create webhook
export async function createWebhook(input: CreateWebhookInput): Promise<Webhook> {
  const response = await api.post<WebhookResponse>('/webhooks', input);
  return response.data.data;
}

// Update webhook
export async function updateWebhook(id: number, input: UpdateWebhookInput): Promise<Webhook> {
  const response = await api.put<WebhookResponse>(`/webhooks/${id}`, input);
  return response.data.data;
}

// Delete webhook
export async function deleteWebhook(id: number): Promise<void> {
  await api.delete(`/webhooks/${id}`);
}

// Test webhook
export async function testWebhook(id: number): Promise<{ message: string }> {
  const response = await api.post<{ data: { message: string }; success: boolean }>(
    `/webhooks/${id}/test`
  );
  return response.data.data;
}
