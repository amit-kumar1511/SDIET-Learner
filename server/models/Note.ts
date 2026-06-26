import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true },
  fileType: { type: String, enum: ['image', 'pdf'] },
  type: { type: String, enum: ['Notes', 'PYQ', 'Assignment', 'Task'], required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  extractedText: { type: String },
}, { timestamps: true });

export const Note = mongoose.model('Note', noteSchema);
