import { Router } from 'express';
import * as userController from '../controllers/user.controller.ts';
import { requireAuth, requireAdmin } from '../middlewares/auth.ts';

const router = Router();

// All routes require auth + admin
router.use(requireAuth, requireAdmin);

// GET /api/users - List all users
router.get('/', userController.listUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUser);

// POST /api/users - Create user
router.post('/', userController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

export default router;
