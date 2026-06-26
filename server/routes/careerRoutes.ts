import express from 'express';
import { 
  getCategories, 
  createCategory, 
  getGuides, 
  createGuide, 
  deleteCategory, 
  deleteGuide 
} from '../controllers/careerController.js';
import { protect, teacherOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/categories', protect, getCategories);
router.post('/categories', protect, teacherOrAdmin, createCategory);
router.delete('/categories/:id', protect, teacherOrAdmin, deleteCategory);

router.get('/guides/:categoryId', protect, getGuides);
router.post('/guides', protect, teacherOrAdmin, createGuide);
router.delete('/guides/:id', protect, teacherOrAdmin, deleteGuide);

export default router;
