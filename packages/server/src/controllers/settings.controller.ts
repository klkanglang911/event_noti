import type { Request, Response } from 'express';
import { z } from 'zod';
import * as settingsService from '../services/settingsService.ts';
import { ERROR_CODES } from '@event-noti/shared';
import { startScheduler } from '../scheduler/index.ts';
import { startExpireScheduler } from '../scheduler/expireEvents.ts';

// Validation schema
const updateTimezoneSchema = z.object({
  timezone: z.string().min(1, '时区不能为空'),
});

// GET /api/settings - Get all settings
export function getSettings(_req: Request, res: Response): void {
  const settings = settingsService.getSettings();
  const currentTime = settingsService.getCurrentTimeInTimezone();

  res.json({
    data: {
      ...settings,
      currentTime: currentTime.datetime,
    },
    success: true,
  });
}

// PUT /api/settings/timezone - Update timezone
export function updateTimezone(req: Request, res: Response): void {
  // Check admin permission
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      error: { code: ERROR_CODES.FORBIDDEN, message: '需要管理员权限' },
      success: false,
    });
    return;
  }

  const parseResult = updateTimezoneSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: parseResult.error.issues[0].message,
      },
      success: false,
    });
    return;
  }

  try {
    const settings = settingsService.updateTimezone(parseResult.data.timezone);

    // Restart schedulers so timezone change takes effect immediately
    startScheduler();
    startExpireScheduler();

    const currentTime = settingsService.getCurrentTimeInTimezone();

    res.json({
      data: {
        ...settings,
        currentTime: currentTime.datetime,
      },
      success: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message === '无效的时区') {
      res.status(400).json({
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: error.message },
        success: false,
      });
      return;
    }
    throw error;
  }
}
