import express from 'express';
import { body } from 'express-validator';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  assignComplaint,
  updateStatus,
  addNote,
  deleteComplaint,
  getStats,
} from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getComplaints)
  .post(
    [
      body('title').notEmpty().withMessage('Title is required'),
      body('description').notEmpty().withMessage('Description is required'),
    ],
    createComplaint
  );

router.get('/stats/summary', getStats);

router.route('/:id').get(getComplaintById).delete(deleteComplaint);

router.put('/:id/assign', authorize('admin'), assignComplaint);
router.put('/:id/status', authorize('agent', 'admin'), updateStatus);
router.post('/:id/notes', addNote);

export default router;
