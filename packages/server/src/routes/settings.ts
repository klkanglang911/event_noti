import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller.ts';

const router = Router();

// GET /api/settings - Get all settings
router.get('/', settingsController.getSettings);

// PUT /api/settings/timezone - Update timezone
router.put('/timezone', settingsController.updateTimezone);

export default router;
