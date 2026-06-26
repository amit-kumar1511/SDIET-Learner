import mongoose from 'mongoose';

const studentPlanSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['today', 'seven_days', 'one_month', 'six_months', 'one_year', 'custom'], 
    required: true 
  },
  startDate: { type: Date, required: true },
  targetDate: { type: Date, required: true },
  content: { type: String, required: true }, // HTML format for rich text
  plainTextContent: { type: String, required: true }, // Plain text for sharing
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed'], 
    default: 'pending' 
  },
  shareToken: { type: String, unique: true, sparse: true },
  isShared: { type: Boolean, default: false }
}, { timestamps: true });

// Indexing for quick retrieval of student's plans
studentPlanSchema.index({ studentId: 1, category: 1 });

export const StudentPlan = mongoose.model('StudentPlan', studentPlanSchema);
