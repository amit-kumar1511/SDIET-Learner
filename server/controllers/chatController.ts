import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Chat } from '../models/Chat.js';
import { Subject } from '../models/Subject.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { TeacherAssignment } from '../models/TeacherAssignment.js';
import { emitNotification } from '../utils/socket.js';
import { sendEmail } from '../utils/sendEmail.js';

export const getChats = asyncHandler(async (req: any, res: Response) => {
  const { subjectId } = req.params;
  let query: any = { subjectId };

  if (req.user.role === 'STUDENT') {
    query.studentId = req.user._id;
  } else if (req.user.role === 'TEACHER') {
    // Check if teacher is assigned to this subject
    const assignment = await TeacherAssignment.findOne({ teacherId: req.user._id, subjectId });
    if (!assignment && req.user.role !== 'SUPER_ADMIN') {
      res.status(403);
      throw new Error('Not assigned to this subject');
    }
  }

  // Mark messages as read if viewed by teacher/admin
  if (req.user.role === 'TEACHER' || req.user.role === 'SUPER_ADMIN') {
    await Chat.updateMany(
      { subjectId, senderRole: 'STUDENT', isRead: false },
      { $set: { isRead: true } }
    );
  }

  const chats = await Chat.find(query)
    .populate('studentId', 'name')
    .populate('teacherId', 'name')
    .sort({ createdAt: 1 });

  res.json(chats);
});

export const sendMessage = asyncHandler(async (req: any, res: Response) => {
  const { subjectId, message, studentId } = req.body;

  if (req.user.role === 'STUDENT') {
    // ... (limit check omitted for brevity but I should keep it)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await Chat.countDocuments({
      studentId: req.user._id,
      createdAt: { $gte: today },
      senderRole: 'STUDENT',
    });

    if (count >= 10) {
      res.status(400);
      throw new Error('Daily limit of 10 messages reached');
    }

    const chat = await Chat.create({
      subjectId,
      studentId: req.user._id,
      message,
      senderRole: 'STUDENT',
    });

    const subject = await Subject.findById(subjectId);
    if (subject) {
      // Logic change: find teachers by explicit assignment to this subject
      const assignments = await TeacherAssignment.find({ subjectId: subject._id }).populate('teacherId');
      const teachers = assignments.map(a => a.teacherId as any).filter(t => t !== null);
      
      const emails = teachers.map(t => t.email);
      if (emails.length > 0) {
        await sendEmail(emails.join(','), `New Doubt in ${subject.name}`, `A student asked: ${message}`);
      }

      for (const teacher of teachers) {
        const notification = await Notification.create({
          recipientId: teacher._id,
          senderId: req.user._id,
          type: 'DOUBT_POSTED',
          message: `New doubt in ${subject.name}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          subjectId: subject._id,
        });
        emitNotification(teacher._id.toString(), notification);
      }
    }

    res.status(201).json(chat);
  } else if (req.user.role === 'TEACHER' || req.user.role === 'SUPER_ADMIN') {
    // Verify teacher assignment before allowing reply if they are a teacher
    if (req.user.role === 'TEACHER') {
      const assignment = await TeacherAssignment.findOne({ teacherId: req.user._id, subjectId });
      if (!assignment) {
        res.status(403);
        throw new Error('Not assigned to this subject');
      }
    }

    const chat = await Chat.create({
      subjectId,
      studentId,
      teacherId: req.user._id,
      message,
      senderRole: req.user.role,
    });
    // ... (notification logic continues)

    // Notify student of the reply
    const subject = await Subject.findById(subjectId);
    if (subject) {
      const notification = await Notification.create({
        recipientId: studentId,
        senderId: req.user._id,
        type: 'DOUBT_REPLIED',
        message: `Teacher replied in ${subject.name}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
        subjectId: subject._id,
      });
      emitNotification(studentId.toString(), notification);
    }

    res.status(201).json(chat);
  } else {
    res.status(403);
    throw new Error('Not authorized to send messages');
  }
});
