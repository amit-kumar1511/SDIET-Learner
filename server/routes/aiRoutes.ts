import express from 'express';
import { 
  startAISession,
  getAISessionDetail,
  endAISession,
  clearAIChat,
  sendAIChatMessage
} from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/sessions')
  .post(protect, startAISession);

router.route('/sessions/:sessionId')
  .get(protect, getAISessionDetail);

router.route('/sessions/:sessionId/end')
  .patch(protect, endAISession);

router.route('/sessions/:sessionId/chat')
  .delete(protect, clearAIChat);

router.route('/chat')
  .post(protect, sendAIChatMessage);

export default router;
