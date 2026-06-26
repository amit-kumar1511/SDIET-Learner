import express from 'express';
import { getNotes, uploadNote, deleteNote, getStudentResources } from '../controllers/noteController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.route('/student/resources').get(protect, getStudentResources);
router.route('/subject/:subjectId').get(protect, getNotes);
router.route('/').post(protect, upload.single('file'), uploadNote);
router.route('/:id').delete(protect, deleteNote);

export default router;
