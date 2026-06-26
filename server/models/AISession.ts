import mongoose from 'mongoose';

const aiSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  semester: { type: Number, required: true },
  topic: { type: String, required: true },
  mode: { 
    type: String, 
    enum: ['Explain Topic', 'Quick Summary', 'Viva Questions', 'MCQ Generator', 'Revision Mode'],
    required: true 
  },
  title: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const AISession = mongoose.model('AISession', aiSessionSchema);
