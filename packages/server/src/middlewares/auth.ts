import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService.ts';
import type { AuthUser } from '@event-noti/shared';
import { ERROR_CODES } from '@event-noti/shared';

// Extend Express Request type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Extract token from request
function extractToken(req: Request): string | null {
  // Try Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
}

// Authentication middleware - requires valid token
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      error: { code: ERROR_CODES.UNAUTHORIZED, message: '未登录' },
      success: false,
    });
    return;
  }

  const user = authService.verifyToken(token);

  if (!user) {
    res.status(401).json({
      error: { code: ERROR_CODES.TOKEN_INVALID, message: 'Token 无效或已过期' },
      success: false,
    });
    return;
  }

  req.user = user;
  next();
}

// Admin middleware - requires admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // First check if authenticated
  if (!req.user) {
    res.status(401).json({
      error: { code: ERROR_CODES.UNAUTHORIZED, message: '未登录' },
      success: false,
    });
    return;
  }

  // Then check admin role
  if (req.user.role !== 'admin') {
    res.status(403).json({
      error: { code: ERROR_CODES.ADMIN_REQUIRED, message: '需要管理员权限' },
      success: false,
    });
    return;
  }

  next();
}

// Optional auth middleware - attaches user if token present but doesn't require it
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (token) {
    const user = authService.verifyToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}
