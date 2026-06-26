import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  branch: { type: String, required: true }, // Can be 'ALL' or specific branch
  semester: { type: String, required: true }, // Can be 'ALL' or specific semester (stored as string to allow 'ALL')
  expiryDate: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Reminder = mongoose.model('Reminder', reminderSchema);
