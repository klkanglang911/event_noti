import api from './api';
import type { Notification } from '@event-noti/shared';

export interface NotificationListResult {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface NotificationListResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
}

interface NotificationStatsResponse {
  data: {
    total: number;
    pending: number;
    sent: number;
    failed: number;
  };
  success: boolean;
}

// Get notifications with pagination
export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<NotificationListResult> {
  const response = await api.get<NotificationListResponse>('/notifications', { params });
  return {
    notifications: response.data.data,
    pagination: response.data.pagination,
  };
}

// Get notification stats
export async function getNotificationStats(): Promise<NotificationStatsResponse['data']> {
  const response = await api.get<NotificationStatsResponse>('/notifications/stats');
  return response.data.data;
}

// Retry failed notification
export async function retryNotification(id: number): Promise<void> {
  await api.post(`/notifications/${id}/retry`);
}

// Delete notification
export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
