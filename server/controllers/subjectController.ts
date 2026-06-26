import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Subject } from '../models/Subject.js';

import { TeacherAssignment } from '../models/TeacherAssignment.js';

export const getSubjects = asyncHandler(async (req: any, res: Response) => {
  const { branch, semester } = req.query;
  let query: any = {};
  
  if (req.user.role === 'STUDENT') {
    if (!req.user.branch || !req.user.semester) {
      res.json([]);
      return;
    }
    query.branch = req.user.branch;
    query.semester = req.user.semester;
  } else if (req.user.role === 'TEACHER') {
    // Teachers only see assigned subjects
    const assignments = await TeacherAssignment.find({ teacherId: req.user._id });
    const assignedSubjectIds = assignments.map(a => a.subjectId);
    
    query._id = { $in: assignedSubjectIds };

    if (branch) query.branch = branch;
    if (semester) query.semester = Number(semester);
  } else {
    // Super Admin or others
    if (branch) query.branch = branch;
    if (semester) query.semester = Number(semester);
  }

  const subjects = await Subject.find(query);
  res.json(subjects);
});

export const getSubjectById = asyncHandler(async (req: Request, res: Response) => {
  const subject = await Subject.findById(req.params.id);
  if (subject) {
    res.json(subject);
  } else {
    res.status(404);
    throw new Error('Subject not found');
  }
});

export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, logoUrl, branch, semester } = req.body;
  const subject = await Subject.create({ name, description, logoUrl, branch, semester });
  res.status(201).json(subject);
});
