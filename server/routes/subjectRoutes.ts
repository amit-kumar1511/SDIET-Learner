import express from 'express';
import { getSubjects, createSubject, getSubjectById, deleteSubject } from '../controllers/subjectController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getSubjects).post(protect, admin, createSubject);
router.route('/:id').get(protect, getSubjectById).delete(protect, admin, deleteSubject);

export default router;
