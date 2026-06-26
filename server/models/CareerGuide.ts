import mongoose from 'mongoose';

const careerGuideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerCategory', required: true },
  content: { type: String }, // Long text/description
  attachments: [{
    url: { type: String },
    type: { type: String, enum: ['image', 'pdf'] }
  }],
  links: [{
    title: { type: String },
    url: { type: String }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const CareerGuide = mongoose.model('CareerGuide', careerGuideSchema);
