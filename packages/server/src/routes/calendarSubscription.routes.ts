import { Router } from 'express';
import * as calendarSubscriptionController from '../controllers/calendarSubscription.controller.ts';
import { requireAuth } from '../middlewares/auth.ts';

const router = Router();

// All routes require auth
router.use(requireAuth);

// GET /api/calendar-subscription - Get current user's subscription
router.get('/', calendarSubscriptionController.getCalendarSubscription);

// PUT /api/calendar-subscription - Update current user's subscription (upsert)
router.put('/', calendarSubscriptionController.updateCalendarSubscription);

export default router;
