import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.ts';
import { requireAuth } from '../middlewares/auth.ts';

const router = Router();

// All routes require auth
router.use(requireAuth);

// GET /api/notifications/stats - Get notification statistics (before :id route)
router.get('/stats', notificationController.getStats);

// GET /api/notifications - List notifications with pagination
router.get('/', notificationController.listNotifications);

// GET /api/notifications/:id - Get notification by ID
router.get('/:id', notificationController.getNotification);

// POST /api/notifications/:id/retry - Retry failed notification
router.post('/:id/retry', notificationController.retryNotification);

export default router;
