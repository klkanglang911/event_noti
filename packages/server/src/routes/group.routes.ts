import { Router } from 'express';
import * as groupController from '../controllers/group.controller.ts';
import { requireAuth } from '../middlewares/auth.ts';

const router = Router();

// All routes require auth
router.use(requireAuth);

// GET /api/groups - List groups
router.get('/', groupController.listGroups);

// GET /api/groups/:id - Get group
router.get('/:id', groupController.getGroup);

// POST /api/groups - Create group
router.post('/', groupController.createGroup);

// PUT /api/groups/:id - Update group
router.put('/:id', groupController.updateGroup);

// DELETE /api/groups/:id - Delete group
router.delete('/:id', groupController.deleteGroup);

export default router;
