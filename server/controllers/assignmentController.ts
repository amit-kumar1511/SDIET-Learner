import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { TeacherAssignment } from '../models/TeacherAssignment.js';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { sendAssignmentMail } from '../utils/sendEmail.js';

export const assignSubjects = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, branch, semester, subjectIds } = req.body;

  // Validate teacher exists
  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== 'TEACHER') {
    res.status(404);
    throw new Error('Teacher not found');
  }

  // Get subject names for email
  const subjects = await Subject.find({ _id: { $in: subjectIds } });
  const subjectNames = subjects.map(s => s.name);

  // Create assignments
  const assignments = await Promise.all(subjectIds.map(async (subjectId: string) => {
    try {
      return await TeacherAssignment.findOneAndUpdate(
        { teacherId, branch, semester, subjectId },
        { teacherId, branch, semester, subjectId },
        { upsert: true, new: true }
      );
    } catch (err) {
      // Ignore duplicates if race condition
      return null;
    }
  }));

  // Send assignment email
  await sendAssignmentMail({
    to: teacher.email,
    branch,
    semester,
    subjects: subjectNames
  });

  res.status(201).json(assignments.filter(a => a !== null));
});

export const removeAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  console.log('--- Remove Assignment Request ---');
  console.log('Raw ID from params:', id);

  if (!id || id === 'undefined' || id === 'null') {
    console.error('Invalid ID provided:', id);
    res.status(400);
    throw new Error('Valid Assignment ID is required');
  }

  try {
    // Validate if it is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('ID is not a valid ObjectId:', id);
      res.status(400);
      throw new Error('Invalid Assignment ID format');
    }

    // Find and delete
    const assignment = await TeacherAssignment.findByIdAndDelete(id);
    
    if (!assignment) {
      console.log('Assignment not found in database for ID:', id);
      res.status(404);
      throw new Error('Assignment mapping not found or already deleted');
    }
    
    console.log('Successfully deleted assignment:', id);
    res.json({ success: true, message: 'Assignment mapping removed successfully' });
  } catch (error: any) {
    console.error('Error during assignment removal:', error.message);
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw error;
  }
});

export const getTeacherAssignments = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;
  const assignments = await TeacherAssignment.find({ teacherId }).populate('subjectId');
  res.json(assignments);
});

export const getAllAssignments = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await TeacherAssignment.find({}).populate('teacherId', 'name email').populate('subjectId');
  res.json(assignments);
});
