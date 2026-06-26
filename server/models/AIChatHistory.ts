import mongoose from 'mongoose';

const aiChatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AISession', required: true, index: true },
  sender: { type: String, enum: ['user', 'model'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const AIChatHistory = mongoose.model('AIChatHistory', aiChatHistorySchema);
