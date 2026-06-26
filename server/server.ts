import './config/env.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import eventNoticeRoutes from './routes/eventNoticeRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import careerRoutes from './routes/careerRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { studentPlanRouter, shareRouter } from './routes/studentPlanRoutes.js';
import { initSocket } from './utils/socket.js';
import { createServer } from 'http';

// config initialized above

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

import { User } from './models/User.js';
import { Subject } from './models/Subject.js';
import { Note } from './models/Note.js';
import { Event } from './models/Event.js';
import { Notice } from './models/Notice.js';
import { Chat } from './models/Chat.js';
import bcrypt from 'bcryptjs';

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(MONGODB_URI!)
  .then(async () => {
    console.log('Connected to MongoDB');
    // Seed Super Admin
    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminUser) {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminEmail || !adminPassword) {
        console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be defined in environment variables');
        process.exit(1);
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      adminUser = await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      });
      console.log(`Super Admin seeded with email: ${adminEmail}`);
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/info', eventNoticeRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/student/plans', studentPlanRouter);
app.use('/api/share/plans', shareRouter);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Serve production assets
async function startServer() {
  const httpServer = createServer(app);
  initSocket(httpServer);

  if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
