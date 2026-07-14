import express from 'express';
import {
  googleAuth,
  registerStudent,
  loginUser,
  getProfile,
  updateProfile,
  registerTeacher,
  getTeachers,
  deleteTeacher,
  getStudents,
  toggleBlockUser,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect, admin, teacherOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ── Public auth routes ────────────────────────────────────────────────────
router.post('/google', googleAuth);        // Google ID-token verify (login or get reg token)
router.post('/register', registerStudent); // Complete registration with Google reg token
router.post('/login', loginUser);          // Email + website password login

// Password reset (OTP-based, kept for existing users)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ── Protected user routes ─────────────────────────────────────────────────
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// ── Admin routes ──────────────────────────────────────────────────────────
router.post('/teacher', protect, admin, registerTeacher);
router.get('/teachers', protect, admin, getTeachers);
router.delete('/teacher/:id', protect, admin, deleteTeacher);

// ── Student directory & block routes (Admin and Teacher) ──────────────────
router.get('/students', protect, teacherOrAdmin, getStudents);
router.post('/students/toggle-block/:id', protect, teacherOrAdmin, toggleBlockUser);

export default router;
