import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller.ts';
import { requireAuth } from '../middlewares/auth.ts';

const router = Router();

// All routes require auth
router.use(requireAuth);

// GET /api/settings - Get all settings
router.get('/', settingsController.getSettings);

// PUT /api/settings/timezone - Update timezone
router.put('/timezone', settingsController.updateTimezone);

export default router;
