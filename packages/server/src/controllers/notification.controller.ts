import type { Request, Response } from 'express';
import * as notificationService from '../services/notificationService.ts';
import { ERROR_CODES } from '@event-noti/shared';

// GET /api/notifications - List notifications with pagination
export function listNotifications(req: Request, res: Response): void {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const status = req.query.status as string | undefined;

  // Validate status if provided
  if (status && !['pending', 'sent', 'failed'].includes(status)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的状态筛选参数' },
      success: false,
    });
    return;
  }

  const result = notificationService.getNotificationsByUser(userId, { page, limit, status });

  res.json({
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
    success: true,
  });
}

// GET /api/notifications/:id - Get notification by ID
export function getNotification(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的通知 ID' },
      success: false,
    });
    return;
  }

  const notification = notificationService.getNotificationById(id, userId);

  if (!notification) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '通知不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: notification, success: true });
}

// POST /api/notifications/:id/retry - Retry failed notification
export async function retryNotification(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的通知 ID' },
      success: false,
    });
    return;
  }

  const result = await notificationService.retryNotification(id, userId);

  if (!result.success) {
    res.status(400).json({
      error: { code: ERROR_CODES.WEBHOOK_FAILED, message: result.message },
      success: false,
    });
    return;
  }

  res.json({ data: { message: result.message }, success: true });
}

// GET /api/notifications/stats - Get notification statistics
export function getStats(req: Request, res: Response): void {
  const userId = req.user!.id;
  const stats = notificationService.getNotificationStats(userId);
  res.json({ data: stats, success: true });
}
