import express from 'express';
import { getAchievements, createAchievement, deleteAchievement } from '../controllers/achievementController.js';
import { protect, teacherOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAchievements)
  .post(protect, teacherOrAdmin, createAchievement);

router.route('/:id')
  .delete(protect, teacherOrAdmin, deleteAchievement);

export default router;
