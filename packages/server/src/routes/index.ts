import { Router } from 'express';
import authRoutes from './auth.routes.ts';
import userRoutes from './user.routes.ts';
import eventRoutes from './event.routes.ts';
import groupRoutes from './group.routes.ts';
import webhookRoutes from './webhook.routes.ts';
import notificationRoutes from './notification.routes.ts';
import settingsRoutes from './settings.ts';
import recurringReminderRoutes from './recurringReminder.routes.ts';
import calendarSubscriptionRoutes from './calendarSubscription.routes.ts';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
router.get('/', (_req, res) => {
  res.json({
    message: 'EventNoti API Server',
    version: '1.0.0',
  });
});

// Auth routes
router.use('/auth', authRoutes);

// User management routes (admin only)
router.use('/users', userRoutes);

// Event routes
router.use('/events', eventRoutes);

// Group routes
router.use('/groups', groupRoutes);

// Webhook routes (admin only)
router.use('/webhooks', webhookRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Recurring reminder routes
router.use('/recurring-reminders', recurringReminderRoutes);

// Calendar subscription routes (节日/节气集中订阅)
router.use('/calendar-subscription', calendarSubscriptionRoutes);

// Settings routes
router.use('/settings', settingsRoutes);

export default router;
