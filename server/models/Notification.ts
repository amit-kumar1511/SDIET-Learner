import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['DOUBT_POSTED', 'DOUBT_REPLIED', 'REMINDER_CREATED', 'REMINDER_UPDATED'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  },
  reminderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reminder',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export const Notification = mongoose.model('Notification', notificationSchema);
