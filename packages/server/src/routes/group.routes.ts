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

// POST /api/groups - Create group (admin only)
router.post('/', groupController.createGroup);

// PUT /api/groups/:id - Update group (admin only)
router.put('/:id', groupController.updateGroup);

// DELETE /api/groups/:id - Delete group (admin only)
router.delete('/:id', groupController.deleteGroup);

// GET /api/groups/:id/users - Get users assigned to group (admin only)
router.get('/:id/users', groupController.getGroupUsers);

// PUT /api/groups/:id/users - Set users assigned to group (admin only)
router.put('/:id/users', groupController.setGroupUsers);

export default router;
