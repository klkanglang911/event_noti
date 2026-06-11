import type { Request, Response } from 'express';
import { z } from 'zod';
import * as recurringReminderService from '../services/recurringReminderService.ts';
import { ERROR_CODES } from '@event-noti/shared';
import type { ReminderCategory } from '@event-noti/shared';

// Validation schemas
const createRecurringReminderSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100),
  content: z.string().max(500).optional(),
  category: z.enum(['stand', 'water', 'eye', 'medicine', 'custom']).default('custom'),
  intervalMinutes: z.number().int().min(1, '间隔最小为 1 分钟').max(10080, '间隔最大为 7 天'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式无效').default('09:00'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式无效').default('18:00'),
  workdaysOnly: z.boolean().default(true),
  groupId: z.number().int().positive().optional(),
  messageFormat: z.enum(['text', 'markdown']).default('text'),
});

const updateRecurringReminderSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().max(500).optional().nullable(),
  category: z.enum(['stand', 'water', 'eye', 'medicine', 'custom']).optional(),
  intervalMinutes: z.number().int().min(1).max(10080).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workdaysOnly: z.boolean().optional(),
  groupId: z.number().int().positive().optional().nullable(),
  messageFormat: z.enum(['text', 'markdown']).optional(),
  status: z.enum(['active', 'paused', 'disabled']).optional(),
});

// GET /api/recurring-reminders - List recurring reminders
export function listRecurringReminders(req: Request, res: Response): void {
  const userId = req.user!.id;
  const category = req.query.category as ReminderCategory | undefined;

  const reminders = recurringReminderService.getRecurringRemindersByUser(userId, category);
  res.json({ data: reminders, success: true });
}

// GET /api/recurring-reminders/:id - Get recurring reminder
export function getRecurringReminder(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的提醒 ID' },
      success: false,
    });
    return;
  }

  const reminder = recurringReminderService.getRecurringReminderById(id);

  if (!reminder || reminder.userId !== userId) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '提醒不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: reminder, success: true });
}

// POST /api/recurring-reminders - Create recurring reminder
export function createRecurringReminder(req: Request, res: Response): void {
  const userId = req.user!.id;

  const parseResult = createRecurringReminderSchema.safeParse(req.body);

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
    const reminder = recurringReminderService.createRecurringReminder(userId, parseResult.data);
    res.status(201).json({ data: reminder, success: true });
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

// PUT /api/recurring-reminders/:id - Update recurring reminder
export function updateRecurringReminder(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的提醒 ID' },
      success: false,
    });
    return;
  }

  const parseResult = updateRecurringReminderSchema.safeParse(req.body);

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
    const reminder = recurringReminderService.updateRecurringReminder(id, userId, parseResult.data);

    if (!reminder) {
      res.status(404).json({
        error: { code: ERROR_CODES.NOT_FOUND, message: '提醒不存在' },
        success: false,
      });
      return;
    }

    res.json({ data: reminder, success: true });
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

// DELETE /api/recurring-reminders/:id - Delete recurring reminder
export function deleteRecurringReminder(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的提醒 ID' },
      success: false,
    });
    return;
  }

  const success = recurringReminderService.deleteRecurringReminder(id, userId);

  if (!success) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '提醒不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: { message: '提醒已删除' }, success: true });
}

// POST /api/recurring-reminders/:id/pause - Pause recurring reminder
export function pauseRecurringReminder(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的提醒 ID' },
      success: false,
    });
    return;
  }

  try {
    const reminder = recurringReminderService.pauseRecurringReminder(id, userId);

    if (!reminder) {
      res.status(404).json({
        error: { code: ERROR_CODES.NOT_FOUND, message: '提醒不存在' },
        success: false,
      });
      return;
    }

    res.json({ data: reminder, success: true });
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

// POST /api/recurring-reminders/:id/resume - Resume recurring reminder
export function resumeRecurringReminder(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的提醒 ID' },
      success: false,
    });
    return;
  }

  try {
    const reminder = recurringReminderService.resumeRecurringReminder(id, userId);

    if (!reminder) {
      res.status(404).json({
        error: { code: ERROR_CODES.NOT_FOUND, message: '提醒不存在' },
        success: false,
      });
      return;
    }

    res.json({ data: reminder, success: true });
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

// GET /api/recurring-reminders/:id/logs - Get reminder logs
export function getRecurringReminderLogs(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的提醒 ID' },
      success: false,
    });
    return;
  }

  const logs = recurringReminderService.getRecurringReminderLogs(id, userId, limit);
  res.json({ data: logs, success: true });
}
