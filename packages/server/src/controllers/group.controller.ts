import type { Request, Response } from 'express';
import { z } from 'zod';
import * as groupService from '../services/groupService.ts';
import { ERROR_CODES, DEFAULTS } from '@event-noti/shared';

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式无效').default(DEFAULTS.GROUP_COLOR),
  webhookId: z.number().int().positive().optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  webhookId: z.number().int().positive().optional().nullable(),
});

// GET /api/groups - List groups
export function listGroups(req: Request, res: Response): void {
  const userId = req.user!.id;
  const groups = groupService.getGroupsByUser(userId);
  res.json({ data: groups, success: true });
}

// GET /api/groups/:id - Get group
export function getGroup(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的分组 ID' },
      success: false,
    });
    return;
  }

  const group = groupService.getGroupById(id);

  if (!group || group.userId !== userId) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '分组不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: group, success: true });
}

// POST /api/groups - Create group
export function createGroup(req: Request, res: Response): void {
  const userId = req.user!.id;

  const parseResult = createGroupSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: parseResult.error.errors[0].message,
      },
      success: false,
    });
    return;
  }

  try {
    const group = groupService.createGroup(userId, parseResult.data);
    res.status(201).json({ data: group, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Webhook 不存在') {
      res.status(400).json({
        error: { code: ERROR_CODES.NOT_FOUND, message: error.message },
        success: false,
      });
      return;
    }
    throw error;
  }
}

// PUT /api/groups/:id - Update group
export function updateGroup(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的分组 ID' },
      success: false,
    });
    return;
  }

  const parseResult = updateGroupSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: parseResult.error.errors[0].message,
      },
      success: false,
    });
    return;
  }

  try {
    const group = groupService.updateGroup(id, userId, parseResult.data);

    if (!group) {
      res.status(404).json({
        error: { code: ERROR_CODES.NOT_FOUND, message: '分组不存在' },
        success: false,
      });
      return;
    }

    res.json({ data: group, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Webhook 不存在') {
      res.status(400).json({
        error: { code: ERROR_CODES.NOT_FOUND, message: error.message },
        success: false,
      });
      return;
    }
    throw error;
  }
}

// DELETE /api/groups/:id - Delete group
export function deleteGroup(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的分组 ID' },
      success: false,
    });
    return;
  }

  const success = groupService.deleteGroup(id, userId);

  if (!success) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '分组不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: { message: '分组已删除' }, success: true });
}
