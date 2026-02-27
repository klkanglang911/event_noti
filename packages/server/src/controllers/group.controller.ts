import type { Request, Response } from 'express';
import { z } from 'zod';
import * as groupService from '../services/groupService.ts';
import { ERROR_CODES, DEFAULTS } from '@event-noti/shared';

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().trim().min(1, '名称不能为空').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式无效').default(DEFAULTS.GROUP_COLOR),
  webhookId: z.number().int().positive().optional(),
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(1, '名称不能为空').max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  webhookId: z.number().int().positive().optional().nullable(),
});

const assignUsersSchema = z.object({
  userIds: z.array(z.number().int().positive()),
});

// Helper to check admin
function requireAdmin(req: Request, res: Response): boolean {
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      error: { code: ERROR_CODES.FORBIDDEN, message: '需要管理员权限' },
      success: false,
    });
    return false;
  }
  return true;
}

// GET /api/groups - List groups
// Admin: see all groups
// User: see only assigned groups
export function listGroups(req: Request, res: Response): void {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  const groups = groupService.getGroups(userId, isAdmin);
  res.json({ data: groups, success: true });
}

// GET /api/groups/:id - Get group
export function getGroup(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的分组 ID' },
      success: false,
    });
    return;
  }

  const group = groupService.getGroupById(id, userId, isAdmin);

  if (!group) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '分组不存在或无权访问' },
      success: false,
    });
    return;
  }

  res.json({ data: group, success: true });
}

// POST /api/groups - Create group (admin only)
export function createGroup(req: Request, res: Response): void {
  if (!requireAdmin(req, res)) return;

  const userId = req.user!.id;
  const parseResult = createGroupSchema.safeParse(req.body);

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
    const group = groupService.createGroup(userId, parseResult.data);
    res.status(201).json({ data: group, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === groupService.GROUP_NAME_EXISTS_ERROR) {
      res.status(409).json({
        error: { code: ERROR_CODES.ALREADY_EXISTS, message: error.message },
        success: false,
      });
      return;
    }

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

// PUT /api/groups/:id - Update group (admin only)
export function updateGroup(req: Request, res: Response): void {
  if (!requireAdmin(req, res)) return;

  const id = parseInt(req.params.id, 10);

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
        message: parseResult.error.issues[0].message,
      },
      success: false,
    });
    return;
  }

  try {
    const group = groupService.updateGroup(id, parseResult.data);

    if (!group) {
      res.status(404).json({
        error: { code: ERROR_CODES.NOT_FOUND, message: '分组不存在' },
        success: false,
      });
      return;
    }

    res.json({ data: group, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === groupService.GROUP_NAME_EXISTS_ERROR) {
      res.status(409).json({
        error: { code: ERROR_CODES.ALREADY_EXISTS, message: error.message },
        success: false,
      });
      return;
    }

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

// DELETE /api/groups/:id - Delete group (admin only)
export function deleteGroup(req: Request, res: Response): void {
  if (!requireAdmin(req, res)) return;

  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的分组 ID' },
      success: false,
    });
    return;
  }

  const success = groupService.deleteGroup(id);

  if (!success) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '分组不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: { message: '分组已删除' }, success: true });
}

// GET /api/groups/:id/users - Get users assigned to group (admin only)
export function getGroupUsers(req: Request, res: Response): void {
  if (!requireAdmin(req, res)) return;

  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的分组 ID' },
      success: false,
    });
    return;
  }

  const users = groupService.getAssignedUsers(id);
  res.json({ data: users, success: true });
}

// PUT /api/groups/:id/users - Set users assigned to group (admin only)
export function setGroupUsers(req: Request, res: Response): void {
  if (!requireAdmin(req, res)) return;

  const id = parseInt(req.params.id, 10);
  const assignedBy = req.user!.id;

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的分组 ID' },
      success: false,
    });
    return;
  }

  const parseResult = assignUsersSchema.safeParse(req.body);

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

  const success = groupService.setAssignedUsers(id, parseResult.data.userIds, assignedBy);

  if (!success) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '分组不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: { message: '用户分配已更新' }, success: true });
}
