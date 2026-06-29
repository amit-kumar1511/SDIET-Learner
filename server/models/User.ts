import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['SUPER_ADMIN', 'TEACHER', 'STUDENT'], required: true },
  
  // Student specific
  branch: { type: String, enum: ['Btech CSE', 'Btech CE', 'BCA GEN', 'BCA DS', 'BBA GEN', 'BBA FISB', 'BBA DM'] },
  semester: { type: Number, min: 1, max: 8 },
  rollNumber: { type: String }, // e.g. CSE-22/016
  
  // Teacher specific
  authorizedBranches: [{ type: String }],
  authorizedSemesters: [{ type: Number }],

  // Block status
  isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
