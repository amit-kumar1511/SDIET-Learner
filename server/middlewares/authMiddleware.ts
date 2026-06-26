import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token as string;
  }

  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        res.status(401).json({ message: 'Not authorized, user not found' });
        return;
      }
      
      next();
      return;
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  }

  res.status(401).json({ message: 'Not authorized, no token' });
  return;
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

export const teacherOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'TEACHER')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a teacher or admin' });
  }
};
