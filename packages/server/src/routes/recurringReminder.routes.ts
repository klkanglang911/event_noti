import { Router } from 'express';
import * as recurringReminderController from '../controllers/recurringReminder.controller.ts';
import { requireAuth } from '../middlewares/auth.ts';

const router = Router();

// All routes require auth
router.use(requireAuth);

// GET /api/recurring-reminders - List recurring reminders
router.get('/', recurringReminderController.listRecurringReminders);

// GET /api/recurring-reminders/:id - Get recurring reminder
router.get('/:id', recurringReminderController.getRecurringReminder);

// POST /api/recurring-reminders - Create recurring reminder
router.post('/', recurringReminderController.createRecurringReminder);

// PUT /api/recurring-reminders/:id - Update recurring reminder
router.put('/:id', recurringReminderController.updateRecurringReminder);

// DELETE /api/recurring-reminders/:id - Delete recurring reminder
router.delete('/:id', recurringReminderController.deleteRecurringReminder);

// POST /api/recurring-reminders/:id/pause - Pause recurring reminder
router.post('/:id/pause', recurringReminderController.pauseRecurringReminder);

// POST /api/recurring-reminders/:id/resume - Resume recurring reminder
router.post('/:id/resume', recurringReminderController.resumeRecurringReminder);

// GET /api/recurring-reminders/:id/logs - Get reminder logs
router.get('/:id/logs', recurringReminderController.getRecurringReminderLogs);

export default router;
