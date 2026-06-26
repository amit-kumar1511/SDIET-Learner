import mongoose from 'mongoose';

const careerCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  branch: { type: String, required: true }, // 'BTECH', 'MBA', etc. or 'ALL'
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const CareerCategory = mongoose.model('CareerCategory', careerCategorySchema);
