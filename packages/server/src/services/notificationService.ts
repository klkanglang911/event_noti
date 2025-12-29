import * as notificationModel from '../models/notificationModel.ts';
import * as eventModel from '../models/eventModel.ts';
import * as groupModel from '../models/groupModel.ts';
import * as webhookModel from '../models/webhookModel.ts';
import * as webhookService from './webhookService.ts';
import type { Notification } from '@event-noti/shared';

// Get notifications by user with pagination
export function getNotificationsByUser(
  userId: number,
  options: { page?: number; limit?: number; status?: string } = {}
): { data: Notification[]; total: number; page: number; limit: number } {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 20, 100); // Max 100 per page

  const result = notificationModel.findByUserId(userId, { page, limit, status: options.status });

  return {
    ...result,
    page,
    limit,
  };
}

// Get notification by ID (with ownership check)
export function getNotificationById(id: number, userId: number): Notification | null {
  const notification = notificationModel.findById(id);

  if (!notification) {
    return null;
  }

  // Check ownership via event
  const event = eventModel.findById(notification.eventId);
  if (!event || event.userId !== userId) {
    return null;
  }

  return notification;
}

// Retry a failed notification
export async function retryNotification(
  id: number,
  userId: number
): Promise<{ success: boolean; message: string }> {
  const notification = notificationModel.findById(id);

  if (!notification) {
    return { success: false, message: '通知不存在' };
  }

  // Check ownership via event
  const event = eventModel.findById(notification.eventId);
  if (!event || event.userId !== userId) {
    return { success: false, message: '通知不存在' };
  }

  if (notification.status !== 'failed') {
    return { success: false, message: '只能重试失败的通知' };
  }

  // Find webhook URL
  let webhookUrl: string | null = null;

  if (event.groupId) {
    const group = groupModel.findById(event.groupId);
    if (group?.webhookId) {
      const webhook = webhookModel.findById(group.webhookId);
      webhookUrl = webhook?.url || null;
    }
  }

  if (!webhookUrl) {
    const defaultWebhook = webhookModel.findDefault();
    webhookUrl = defaultWebhook?.url || null;
  }

  if (!webhookUrl) {
    return { success: false, message: '未配置 Webhook' };
  }

  // Calculate days remaining
  const today = new Date();
  const targetDate = new Date(event.targetDate);
  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Send notification
  const result = await webhookService.sendNotification(
    webhookUrl,
    event.title,
    event.content || '',
    daysRemaining
  );

  if (result.success) {
    notificationModel.updateStatus(id, 'sent');
    return { success: true, message: '重试成功，通知已发送' };
  } else {
    notificationModel.updateStatus(id, 'failed', result.error);
    return { success: false, message: result.error || '发送失败' };
  }
}

// Get notification statistics for user
export function getNotificationStats(userId: number): {
  total: number;
  pending: number;
  sent: number;
  failed: number;
} {
  const pending = notificationModel.findByUserId(userId, { status: 'pending' });
  const sent = notificationModel.findByUserId(userId, { status: 'sent' });
  const failed = notificationModel.findByUserId(userId, { status: 'failed' });

  return {
    total: pending.total + sent.total + failed.total,
    pending: pending.total,
    sent: sent.total,
    failed: failed.total,
  };
}
