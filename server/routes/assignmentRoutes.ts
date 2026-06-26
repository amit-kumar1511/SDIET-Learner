import express from 'express';
import { 
  assignSubjects, 
  removeAssignment, 
  getTeacherAssignments,
  getAllAssignments 
} from '../controllers/assignmentController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, admin, assignSubjects)
  .get(protect, admin, getAllAssignments);

router.route('/:id')
  .delete(protect, admin, removeAssignment);

router.route('/teacher/:teacherId')
  .get(protect, getTeacherAssignments);

export default router;
