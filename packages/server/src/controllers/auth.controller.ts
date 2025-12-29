import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/authService.ts';
import * as userModel from '../models/userModel.ts';
import { ERROR_CODES } from '@event-noti/shared';

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const parseResult = loginSchema.safeParse(req.body);
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

    const { username, password } = parseResult.data;

    // Attempt login
    const result = await authService.login({ username, password });

    if (!result) {
      res.status(401).json({
        error: { code: ERROR_CODES.AUTH_FAILED, message: '用户名或密码错误' },
        success: false,
      });
      return;
    }

    // Set token in httpOnly cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      data: result,
      success: true,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: '服务器错误' },
      success: false,
    });
  }
}

// POST /api/auth/logout
export function logout(_req: Request, res: Response): void {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json({
    data: { message: '已登出' },
    success: true,
  });
}

// GET /api/auth/me
export function getCurrentUser(req: Request, res: Response): void {
  if (!req.user) {
    res.status(401).json({
      error: { code: ERROR_CODES.UNAUTHORIZED, message: '未登录' },
      success: false,
    });
    return;
  }

  // Get full user data from database
  const user = userModel.findById(req.user.id);

  if (!user || !user.isActive) {
    res.status(401).json({
      error: { code: ERROR_CODES.UNAUTHORIZED, message: '用户不存在或已禁用' },
      success: false,
    });
    return;
  }

  res.json({
    data: { user },
    success: true,
  });
}
