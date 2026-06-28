import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import { Note } from '../models/Note.js';
import { Subject } from '../models/Subject.js';
import { User } from '../models/User.js';
import { sendEmail, sendNoteMail } from '../utils/sendEmail.js';
import { extractTextFromPdf, extractTextFromImage } from '../utils/gemini.js';

export const getNotes = asyncHandler(async (req: Request, res: Response) => {
  const notes = await Note.find({ subjectId: req.params.subjectId }).populate('uploadedBy', 'name');
  res.json(notes);
});

export const uploadNote = asyncHandler(async (req: any, res: Response) => {
  const { title, description, type, subjectId } = req.body;
  const fileUrl = req.file?.path;

  if (!fileUrl) {
    res.status(400);
    throw new Error('File upload failed');
  }

  let fileType: 'image' | 'pdf' | null = null;
  if (req.file) {
    fileType = (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) ? 'pdf' : 'image';
  }

  // Create the note immediately without blocking on OCR
  const note = await Note.create({
    title,
    description,
    fileUrl,
    fileType,
    type,
    subjectId,
    uploadedBy: req.user._id,
  });

  // Respond to the frontend immediately so the progress bar closes
  res.status(201).json(note);

  // Perform PDF/Image text extraction and student notification in the background
  (async () => {
    try {
      let extractedText = '';
      if (fileType === 'pdf') {
        extractedText = await extractTextFromPdf(fileUrl);
      } else if (fileType === 'image') {
        extractedText = await extractTextFromImage(fileUrl);
      }

      if (extractedText) {
        await Note.findByIdAndUpdate(note._id, { extractedText });
        console.log(`Successfully updated note ${note._id} with extracted text.`);
      }

      // Notify students via email
      const subject = await Subject.findById(subjectId);
      if (subject) {
        const students = await User.find({ role: 'STUDENT', branch: subject.branch as any, semester: subject.semester });
        const emails = students.map(s => s.email);
        if (emails.length > 0) {
          await sendNoteMail({
            bcc: emails,
            subjectName: subject.name,
            type: type,
            title: title,
            branch: subject.branch,
            semester: subject.semester
          });
        }
      }
    } catch (bgError) {
      console.error('Error in background note processing:', bgError);
    }
  })();
});

export const deleteNote = asyncHandler(async (req: any, res: Response) => {
  console.log(`Delete request for note: ${req.params.id} by user: ${req.user._id}`);
  const note = await Note.findById(req.params.id);
  if (note) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TEACHER' && note.uploadedBy.toString() !== req.user._id.toString()) {
      console.warn(`Unauthorized delete attempt on note ${note._id} by user ${req.user._id}`);
      res.status(403);
      throw new Error('Not authorized to delete this note');
    }
    const result = await Note.deleteOne({ _id: note._id });
    console.log(`Note deletion result:`, result);
    res.json({ message: 'Note removed' });
  } else {
    console.warn(`Note not found for deletion: ${req.params.id}`);
    res.status(404);
    throw new Error('Note not found');
  }
});

export const getStudentResources = asyncHandler(async (req: any, res: Response) => {
  const { branch, semester } = req.user;

  if (!branch || !semester) {
    res.status(400);
    throw new Error('Student branch and semester are required');
  }

  // Find all subjects in student's branch and semester
  const subjects = await Subject.find({ branch, semester });
  const subjectIds = subjects.map(s => s._id);

  // Find all notes/materials in those subjects
  const notes = await Note.find({ subjectId: { $in: subjectIds } }).populate('subjectId');

  res.json({
    subjects,
    notes
  });
});
