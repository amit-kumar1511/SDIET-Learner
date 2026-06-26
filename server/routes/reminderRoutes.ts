import express from 'express';
import { getReminders, createReminder, updateReminder, deleteReminder } from '../controllers/reminderController.js';
import { protect, teacherOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getReminders)
  .post(protect, teacherOrAdmin, createReminder);

router.route('/:id')
  .put(protect, teacherOrAdmin, updateReminder)
  .delete(protect, teacherOrAdmin, deleteReminder);

export default router;
