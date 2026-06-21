import type { Request, Response } from 'express';
import { z } from 'zod';
import * as calendarSubscriptionService from '../services/calendarSubscriptionService.ts';
import { ERROR_CODES } from '@event-noti/shared';

// Validation schema (upsert: all fields optional, advanceDays bounded)
const updateCalendarSubscriptionSchema = z.object({
  enabled: z.boolean().optional(),
  advanceDays: z.number().int().min(0, '提前天数最小为 0').max(365, '提前天数最大为 365').optional(),
  targetTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式无效').optional(),
  groupId: z.number().int().positive().optional().nullable(),
  messageFormat: z.enum(['text', 'markdown']).optional(),
});

// GET /api/calendar-subscription - Get current user's subscription
export function getCalendarSubscription(req: Request, res: Response): void {
  const userId = req.user!.id;
  const subscription = calendarSubscriptionService.getSubscription(userId);
  res.json({ data: subscription, success: true });
}

// PUT /api/calendar-subscription - Update current user's subscription (upsert)
export function updateCalendarSubscription(req: Request, res: Response): void {
  const userId = req.user!.id;

  const parseResult = updateCalendarSubscriptionSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: parseResult.error.issues[0].message },
      success: false,
    });
    return;
  }

  try {
    const subscription = calendarSubscriptionService.updateSubscription(userId, parseResult.data);
    res.json({ data: subscription, success: true });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: error.message },
        success: false,
      });
      return;
    }
    throw error;
  }
}
