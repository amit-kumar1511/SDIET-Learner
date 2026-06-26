import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Event } from '../models/Event.js';
import { Notice } from '../models/Notice.js';
import { User } from '../models/User.js';
import { sendEventNoticeMail } from '../utils/sendEmail.js';

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await Event.find().sort({ createdAt: -1 }).populate('createdBy', 'name');
  res.json(events);
});

export const createEvent = asyncHandler(async (req: any, res: Response) => {
  const { title, description } = req.body;
  const attachmentUrl = req.file?.path;
  
  let attachmentType: 'image' | 'pdf' | null = null;
  if (req.file) {
    attachmentType = (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) ? 'pdf' : 'image';
  }

  const event = await Event.create({
    title,
    description,
    attachmentUrl,
    attachmentType,
    createdBy: req.user._id,
  });

  const students = await User.find({ role: 'STUDENT' });
  const emails = students.map(s => s.email);
  if (emails.length > 0) {
    await sendEventNoticeMail({
      bcc: emails,
      type: 'Event',
      title: title,
      description: description
    });
  }

  res.status(201).json(event);
});

export const getNotices = asyncHandler(async (req: Request, res: Response) => {
  const notices = await Notice.find().sort({ createdAt: -1 }).populate('createdBy', 'name');
  res.json(notices);
});

export const createNotice = asyncHandler(async (req: any, res: Response) => {
  const { title, description } = req.body;
  const attachmentUrl = req.file?.path;

  let attachmentType: 'image' | 'pdf' | null = null;
  if (req.file) {
    attachmentType = (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) ? 'pdf' : 'image';
  }

  const notice = await Notice.create({
    title,
    description,
    attachmentUrl,
    attachmentType,
    createdBy: req.user._id,
  });

  const students = await User.find({ role: 'STUDENT' });
  const emails = students.map(s => s.email);
  if (emails.length > 0) {
    await sendEventNoticeMail({
      bcc: emails,
      type: 'Notice',
      title: title,
      description: description
    });
  }

  res.status(201).json(notice);
});

export const deleteEvent = asyncHandler(async (req: any, res: Response) => {
  console.log(`Delete request for event: ${req.params.id} by user: ${req.user._id}`);
  const event = await Event.findById(req.params.id);
  if (event) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TEACHER' && event.createdBy.toString() !== req.user._id.toString()) {
      console.warn(`Unauthorized delete attempt on event ${event._id} by user ${req.user._id}`);
      res.status(403);
      throw new Error('Not authorized to delete this event');
    }
    const result = await Event.deleteOne({ _id: event._id });
    console.log(`Event deletion result:`, result);
    res.json({ message: 'Event removed' });
  } else {
    console.warn(`Event not found for deletion: ${req.params.id}`);
    res.status(404);
    throw new Error('Event not found');
  }
});

export const deleteNotice = asyncHandler(async (req: any, res: Response) => {
  console.log(`Delete request for notice: ${req.params.id} by user: ${req.user._id}`);
  const notice = await Notice.findById(req.params.id);
  if (notice) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TEACHER' && notice.createdBy.toString() !== req.user._id.toString()) {
      console.warn(`Unauthorized delete attempt on notice ${notice._id} by user ${req.user._id}`);
      res.status(403);
      throw new Error('Not authorized to delete this notice');
    }
    const result = await Notice.deleteOne({ _id: notice._id });
    console.log(`Notice deletion result:`, result);
    res.json({ message: 'Notice removed' });
  } else {
    console.warn(`Notice not found for deletion: ${req.params.id}`);
    res.status(404);
    throw new Error('Notice not found');
  }
});
