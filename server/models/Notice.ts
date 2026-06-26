import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  attachmentUrl: { type: String },
  attachmentType: { type: String, enum: ['image', 'pdf'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Notice = mongoose.model('Notice', noticeSchema);
