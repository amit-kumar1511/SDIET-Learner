import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import Achievement from '../models/Achievement.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all achievements
// @route   GET /api/achievements
// @access  Public
export const getAchievements = asyncHandler(async (req: Request, res: Response) => {
  const achievements = await Achievement.find({}).sort({ createdAt: -1 });
  const count = await Achievement.countDocuments();
  res.json({ achievements, count });
});

// @desc    Create an achievement
// @route   POST /api/achievements
// @access  Private (Teacher/Admin)
export const createAchievement = asyncHandler(async (req: any, res: Response) => {
  const { title, image } = req.body;

  if (!title || !image) {
    res.status(400);
    throw new Error('Please provide title and image');
  }

  // Check total count limit (300)
  const totalCount = await Achievement.countDocuments();
  if (totalCount >= 300) {
    res.status(400);
    throw new Error('Gallery limit reached (max 300 images). Please delete old ones to upload new.');
  }

  // Check file size (6MB limit)
  const base64Data = image.split(',')[1];
  const sizeInBytes = Buffer.from(base64Data, 'base64').length;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB > 6) {
    res.status(400);
    throw new Error('Image size exceeds 6MB limit. Please upload a smaller image.');
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'achievements',
    });

    const achievement = await Achievement.create({
      title,
      imageUrl: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      uploadedBy: req.user._id,
    });

    res.status(201).json(achievement);
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error('Image upload failed');
  }
});

// @desc    Delete an achievement
// @route   DELETE /api/achievements/:id
// @access  Private (Teacher/Admin)
export const deleteAchievement = asyncHandler(async (req: any, res: Response) => {
  const achievement = await Achievement.findById(req.params.id);

  if (!achievement) {
    res.status(404);
    throw new Error('Achievement not found');
  }

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(achievement.publicId);
  } catch (error) {
    console.error('Cloudinary destroy failed:', error);
  }

  await Achievement.deleteOne({ _id: achievement._id });
  res.json({ message: 'Achievement removed' });
});
