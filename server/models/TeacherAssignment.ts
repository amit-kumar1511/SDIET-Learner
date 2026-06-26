import mongoose from 'mongoose';

const teacherAssignmentSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: String, required: true },
  semester: { type: Number, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
}, { timestamps: true });

// Ensure uniqueness to prevent duplicate assignments
teacherAssignmentSchema.index({ teacherId: 1, branch: 1, semester: 1, subjectId: 1 }, { unique: true });

export const TeacherAssignment = mongoose.model('TeacherAssignment', teacherAssignmentSchema);
