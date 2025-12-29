import type { Request, Response } from 'express';
import { z } from 'zod';
import * as userService from '../services/userService.ts';
import { ERROR_CODES } from '@event-noti/shared';

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50),
  password: z.string().min(6, '密码至少6个字符'),
  displayName: z.string().min(1, '显示名称不能为空').max(50),
  role: z.enum(['admin', 'user']).optional(),
});

const updateUserSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/users - List all users
export function listUsers(_req: Request, res: Response): void {
  const users = userService.getAllUsers();
  res.json({ data: users, success: true });
}

// GET /api/users/:id - Get user by ID
export function getUser(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的用户 ID' },
      success: false,
    });
    return;
  }

  const user = userService.getUserById(id);

  if (!user) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '用户不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: user, success: true });
}

// POST /api/users - Create user
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = createUserSchema.safeParse(req.body);

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

    const user = await userService.createUser(parseResult.data);
    res.status(201).json({ data: user, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === '用户名已存在') {
      res.status(409).json({
        error: { code: ERROR_CODES.ALREADY_EXISTS, message: error.message },
        success: false,
      });
      return;
    }
    throw error;
  }
}

// PUT /api/users/:id - Update user
export function updateUser(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的用户 ID' },
      success: false,
    });
    return;
  }

  const parseResult = updateUserSchema.safeParse(req.body);

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

  const user = userService.updateUser(id, parseResult.data);

  if (!user) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '用户不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: user, success: true });
}

// DELETE /api/users/:id - Delete user (soft delete)
export function deleteUser(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的用户 ID' },
      success: false,
    });
    return;
  }

  // Cannot delete yourself
  if (req.user?.id === id) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '不能删除自己的账号' },
      success: false,
    });
    return;
  }

  const success = userService.deleteUser(id);

  if (!success) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: '用户不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: { message: '用户已禁用' }, success: true });
}
