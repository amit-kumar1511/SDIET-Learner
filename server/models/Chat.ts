import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  senderRole: { type: String, enum: ['STUDENT', 'TEACHER', 'SUPER_ADMIN'], required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto delete after 24 hours
});

export const Chat = mongoose.model('Chat', chatSchema);
