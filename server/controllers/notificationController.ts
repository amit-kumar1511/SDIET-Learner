import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Notification } from '../models/Notification.js';

export const getNotifications = asyncHandler(async (req: any, res: Response) => {
  const notifications = await Notification.find({ recipientId: req.user._id, isRead: false })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(notifications);
});

export const markAsRead = asyncHandler(async (req: any, res: Response) => {
  const notification = await Notification.findById(req.params.id);
  if (notification) {
    if (notification.recipientId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }
    notification.isRead = true;
    await notification.save();
    res.json({ message: 'Notification marked as read' });
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});

export const markAllAsRead = asyncHandler(async (req: any, res: Response) => {
  await Notification.updateMany(
    { recipientId: req.user._id, isRead: false },
    { isRead: true }
  );
  res.json({ message: 'All notifications marked as read' });
});
