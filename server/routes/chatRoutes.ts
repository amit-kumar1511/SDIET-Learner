import express from 'express';
import { getChats, sendMessage } from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/:subjectId').get(protect, getChats);
router.route('/').post(protect, sendMessage);

export default router;
