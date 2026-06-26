import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { CareerCategory } from '../models/CareerCategory.js';
import { CareerGuide } from '../models/CareerGuide.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all categories
// @route   GET /api/career/categories
export const getCategories = asyncHandler(async (req: any, res: Response) => {
  const categories = await CareerCategory.find({}).sort({ createdAt: -1 });
  res.json(categories);
});

// @desc    Create a category
// @route   POST /api/career/categories
export const createCategory = asyncHandler(async (req: any, res: Response) => {
  const { name, description, branch } = req.body;
  const category = await CareerCategory.create({
    name,
    description,
    branch,
    createdBy: req.user._id
  });
  res.status(201).json(category);
});

// @desc    Delete a category
export const deleteCategory = asyncHandler(async (req: any, res: Response) => {
    const category = await CareerCategory.findById(req.params.id);
    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }
    await category.deleteOne();
    await CareerGuide.deleteMany({ category: req.params.id });
    res.json({ message: 'Category removed' });
});

// @desc    Get guides by category
// @route   GET /api/career/guides/:categoryId
export const getGuides = asyncHandler(async (req: Request, res: Response) => {
  const guides = await CareerGuide.find({ category: req.params.categoryId }).sort({ createdAt: -1 });
  res.json(guides);
});

// @desc    Create a guide
// @route   POST /api/career/guides
export const createGuide = asyncHandler(async (req: any, res: Response) => {
  const { title, categoryId, content, links, attachment } = req.body;

  let attachmentData = null;
  if (attachment) {
    // Basic base64 detection for cloudinary upload
    const uploadRes = await cloudinary.uploader.upload(attachment, {
      folder: 'career_guides',
      resource_type: 'auto'
    });
    
    attachmentData = {
      url: uploadRes.secure_url,
      type: attachment.includes('application/pdf') ? 'pdf' : 'image'
    };
  }

  const guide = await CareerGuide.create({
    title,
    category: categoryId,
    content,
    links: JSON.parse(links || '[]'),
    attachments: attachmentData ? [attachmentData] : [],
    createdBy: req.user._id
  });

  res.status(201).json(guide);
});

// @desc    Delete a guide
export const deleteGuide = asyncHandler(async (req: any, res: Response) => {
    const guide = await CareerGuide.findById(req.params.id);
    if (!guide) {
        res.status(404);
        throw new Error('Guide not found');
    }
    await guide.deleteOne();
    res.json({ message: 'Guide removed' });
});
