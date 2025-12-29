import { Router } from 'express';
import * as eventController from '../controllers/event.controller.ts';
import { requireAuth } from '../middlewares/auth.ts';

const router = Router();

// All routes require auth
router.use(requireAuth);

// GET /api/events - List events
router.get('/', eventController.listEvents);

// GET /api/events/:id - Get event
router.get('/:id', eventController.getEvent);

// POST /api/events - Create event
router.post('/', eventController.createEvent);

// PUT /api/events/:id - Update event
router.put('/:id', eventController.updateEvent);

// DELETE /api/events/:id - Delete event
router.delete('/:id', eventController.deleteEvent);

export default router;
