import express from 'express';
import {
  getUsers,
  getAgents,
  updateUserRole,
  deleteUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', getUsers);
router.get('/agents', getAgents);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
