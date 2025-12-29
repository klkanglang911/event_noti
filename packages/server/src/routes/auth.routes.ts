import { Router } from 'express';
import * as authController from '../controllers/auth.controller.ts';
import { requireAuth } from '../middlewares/auth.ts';

const router = Router();

// POST /api/auth/login - User login
router.post('/login', authController.login);

// POST /api/auth/logout - User logout
router.post('/logout', authController.logout);

// GET /api/auth/me - Get current user
router.get('/me', requireAuth, authController.getCurrentUser);

export default router;
