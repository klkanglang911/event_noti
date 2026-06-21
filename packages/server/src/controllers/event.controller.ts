import type { Request, Response } from 'express';
import { z } from 'zod';
import * as eventService from '../services/eventService.ts';
import { ERROR_CODES } from '@event-noti/shared';

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100),
  content: z.string().max(2000).optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式无效'),
  targetTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式无效').default('09:00'),
  messageFormat: z.enum(['text', 'markdown']).default('text'),
  groupId: z.number().int().positive().optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().max(2000).optional().nullable(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  targetTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  messageFormat: z.enum(['text', 'markdown']).optional(),
  groupId: z.number().int().positive().optional().nullable(),
  status: z.enum(['active', 'expired', 'completed']).optional(),
});

function handleEventServiceError(error: unknown, res: Response): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.message === '分组不存在') {
    res.status(400).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: error.message },
      success: false,
    });
    return true;
  }

  if (error.message === '请选择目标日期') {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: error.message },
      success: false,
    });
    return true;
  }

  return false;
}

// GET /api/events - List events
export function listEvents(req: Request, res: Response): void {
  const userId = req.user!.id;
  const groupId = req.query.groupId ? parseInt(req.query.groupId as string, 10) : undefined;

  const events = eventService.getEventsByUser(userId, groupId);
  res.json({ data: events, success: true });
}

// GET /api/events/:id - Get event
export function getEvent(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的事件 ID' },
      success: false,
    });
    return;
  }

  const event = eventService.getEventById(id);

  if (!event || event.userId !== userId) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '事件不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: event, success: true });
}

// POST /api/events - Create event
export function createEvent(req: Request, res: Response): void {
  const userId = req.user!.id;

  const parseResult = createEventSchema.safeParse(req.body);

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
    const event = eventService.createEvent(userId, parseResult.data);
    res.status(201).json({ data: event, success: true });
  } catch (error) {
    if (handleEventServiceError(error, res)) {
      return;
    }
    throw error;
  }
}

// PUT /api/events/:id - Update event
export function updateEvent(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的事件 ID' },
      success: false,
    });
    return;
  }

  const parseResult = updateEventSchema.safeParse(req.body);

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
    const event = eventService.updateEvent(id, userId, parseResult.data);

    if (!event) {
      res.status(404).json({
        error: { code: ERROR_CODES.NOT_FOUND, message: '事件不存在' },
        success: false,
      });
      return;
    }

    res.json({ data: event, success: true });
  } catch (error) {
    if (handleEventServiceError(error, res)) {
      return;
    }
    throw error;
  }
}

// DELETE /api/events/:id - Delete event
export function deleteEvent(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的事件 ID' },
      success: false,
    });
    return;
  }

  const success = eventService.deleteEvent(id, userId);

  if (!success) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '事件不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: { message: '事件已删除' }, success: true });
}
