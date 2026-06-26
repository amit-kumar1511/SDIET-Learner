import express from 'express';
import { registerStudent, loginUser, getProfile, updateProfile, registerTeacher, getTeachers, deleteTeacher, sendOtp } from '../controllers/authController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerStudent);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin routes
router.post('/teacher', protect, admin, registerTeacher);
router.get('/teachers', protect, admin, getTeachers);
router.delete('/teacher/:id', protect, admin, deleteTeacher);

export default router;
