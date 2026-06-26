import express from 'express';
import { getEvents, createEvent, deleteEvent, getNotices, createNotice, deleteNotice } from '../controllers/eventNoticeController.js';
import { protect, teacherOrAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.route('/events').get(protect, getEvents).post(protect, teacherOrAdmin, upload.single('attachment'), createEvent);
router.route('/events/:id').delete(protect, teacherOrAdmin, deleteEvent);
router.route('/notices').get(protect, getNotices).post(protect, teacherOrAdmin, upload.single('attachment'), createNotice);
router.route('/notices/:id').delete(protect, teacherOrAdmin, deleteNotice);

export default router;
