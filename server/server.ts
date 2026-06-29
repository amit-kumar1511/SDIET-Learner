import './config/env.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

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
import { studentPlanRouter, shareRouter } from './routes/studentPlanRoutes.js';
import { initSocket } from './utils/socket.js';
import { createServer } from 'http';

// config initialized above

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'https://sdiet-learner.vercel.app',
  'http://localhost:5173'
];
if (process.env.FRONTEND_URL) {
  const urls = process.env.FRONTEND_URL.split(',').map(url => url.trim());
  urls.forEach(url => {
    if (url && !allowedOrigins.includes(url)) {
      allowedOrigins.push(url);
    }
  });
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

import { User } from './models/User.js';
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

// Root Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SDIET Learner Backend API is running",
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: "Backend is running"
  });
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

async function startServer() {
  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
