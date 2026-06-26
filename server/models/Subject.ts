import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  logoUrl: { type: String },
  branch: { type: String, required: true, index: true },
  semester: { type: Number, required: true, index: true },
}, { timestamps: true });

export const Subject = mongoose.model('Subject', subjectSchema);
