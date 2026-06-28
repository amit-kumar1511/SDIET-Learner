import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Reminder } from '../models/Reminder.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { sendReminderMail } from '../utils/sendEmail.js';
import { emitNotification } from '../utils/socket.js';

export const getReminders = asyncHandler(async (req: any, res: Response) => {
  const { role, branch, semester } = req.user;
  
  let query: any = {
    expiryDate: { $gt: new Date() } // Only non-expired reminders
  };

  if (role === 'STUDENT') {
    query.$and = [
      { $or: [{ branch: 'ALL' }, { branch }] },
      { $or: [{ semester: 'ALL' }, { semester: semester?.toString() }] }
    ];
  } // Teacher and Admin can see all active reminders

  const reminders = await Reminder.find(query)
    .populate('createdBy', 'name role')
    .sort('-createdAt');
    
  res.json(reminders);
});

export const createReminder = asyncHandler(async (req: any, res: Response) => {
  const { title, content, branch, semester, expiryHours } = req.body;

  if (!title || !content || !branch || !semester || !expiryHours) {
    res.status(400);
    throw new Error('Please provide all fields');
  }

  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + parseInt(expiryHours));

  const reminder = await Reminder.create({
    title,
    content,
    branch,
    semester,
    expiryDate,
    createdBy: req.user._id,
  });

  const query: any = { role: 'STUDENT' };
  if (branch !== 'ALL') query.branch = branch;
  if (semester !== 'ALL') query.semester = parseInt(semester);

  const students = await User.find(query);
  const emails = students.map(s => s.email);

  const populatedReminder = await Reminder.findById(reminder._id).populate('createdBy', 'name role');

  if (!populatedReminder) {
    res.status(404);
    throw new Error('Reminder not found');
  }

  if (emails.length > 0) {
    const formattedDate = expiryDate.toLocaleString();
    // Process email sending and database notifications in background asynchronously
    (async () => {
      try {
        await sendReminderMail({
          bcc: emails,
          title: title,
          content: content,
          expiryDate: formattedDate
        });
      } catch (err) {
        console.error("Error sending reminder welcome mails in background:", err);
      }

      try {
        for (const student of students) {
          const notification = await Notification.create({
            recipientId: student._id,
            senderId: req.user._id,
            type: 'REMINDER_CREATED',
            message: `New Reminder: ${populatedReminder.title}`,
            reminderId: populatedReminder._id,
          });
          emitNotification(student._id.toString(), notification);
        }
      } catch (err) {
        console.error("Error creating notifications in background:", err);
      }
    })();
  }

  res.status(201).json(populatedReminder);
});

export const updateReminder = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { title, content, branch, semester, expiryHours } = req.body;

  const reminder = await Reminder.findById(id);

  if (!reminder) {
    res.status(404);
    throw new Error('Reminder not found');
  }

  if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TEACHER') {
    res.status(403);
    throw new Error('Not authorized to update reminders');
  }

  reminder.title = title || reminder.title;
  reminder.content = content || reminder.content;
  reminder.branch = branch || reminder.branch;
  reminder.semester = semester || reminder.semester;
  
  if (expiryHours) {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + parseInt(expiryHours));
    reminder.expiryDate = expiryDate;
  }

  const updatedReminder = await reminder.save();
  const populatedReminder = await Reminder.findById(updatedReminder._id).populate('createdBy', 'name role');

  if (!populatedReminder) {
    res.status(404);
    throw new Error('Reminder not found');
  }

  const query: any = { role: 'STUDENT' };
  if (populatedReminder.branch !== 'ALL') query.branch = populatedReminder.branch;
  if (populatedReminder.semester !== 'ALL') query.semester = parseInt(populatedReminder.semester as string);

  const students = await User.find(query);
  const emails = students.map(s => s.email);

  if (emails.length > 0) {
    const formattedDate = populatedReminder.expiryDate.toLocaleString();
    // Process email sending and database notifications in background asynchronously
    (async () => {
      try {
        await sendReminderMail({
          bcc: emails,
          title: `Updated: ${populatedReminder.title}`,
          content: populatedReminder.content,
          expiryDate: formattedDate
        });
      } catch (err) {
        console.error("Error sending updated reminder emails in background:", err);
      }

      try {
        for (const student of students) {
          const notification = await Notification.create({
            recipientId: student._id,
            senderId: req.user._id,
            type: 'REMINDER_UPDATED',
            message: `Reminder Updated: ${populatedReminder.title}`,
            reminderId: populatedReminder._id,
          });
          emitNotification(student._id.toString(), notification);
        }
      } catch (err) {
        console.error("Error creating notifications in background:", err);
      }
    })();
  }

  res.json(populatedReminder);
});

export const deleteReminder = asyncHandler(async (req: any, res: Response) => {
  const reminder = await Reminder.findById(req.params.id);

  if (!reminder) {
    res.status(404);
    throw new Error('Reminder not found');
  }

  if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TEACHER') {
    res.status(403);
    throw new Error('Not authorized to delete reminders');
  }

  await Reminder.deleteOne({ _id: reminder._id });
  res.json({ message: 'Reminder removed' });
});
