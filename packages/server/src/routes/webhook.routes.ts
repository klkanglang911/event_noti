import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller.ts';
import { requireAuth, requireAdmin } from '../middlewares/auth.ts';

const router = Router();

// All routes require auth + admin
router.use(requireAuth, requireAdmin);

// GET /api/webhooks - List webhooks
router.get('/', webhookController.listWebhooks);

// GET /api/webhooks/:id - Get webhook
router.get('/:id', webhookController.getWebhook);

// POST /api/webhooks - Create webhook
router.post('/', webhookController.createWebhook);

// PUT /api/webhooks/:id - Update webhook
router.put('/:id', webhookController.updateWebhook);

// DELETE /api/webhooks/:id - Delete webhook
router.delete('/:id', webhookController.deleteWebhook);

// POST /api/webhooks/:id/test - Test webhook
router.post('/:id/test', webhookController.testWebhook);

export default router;
