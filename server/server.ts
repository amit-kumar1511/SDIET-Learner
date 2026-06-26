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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Sdietean:amitsharma@cluster0.i6ic2ee.mongodb.net/?appName=Cluster0';
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    // Seed Super Admin
    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      adminUser = await User.create({
        name: 'Super Admin',
        email: 'admin@satyug.edu.in',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      });
      console.log('Super Admin seeded: admin@satyug.edu.in / admin123');
    }

    // Seed Dummy Data
    const subjectCount = await Subject.countDocuments();
    if (subjectCount < 384 && adminUser) {
      console.log('Clearing old dummy data and seeding new data...');
      await Subject.deleteMany({});
      await Note.deleteMany({});
      await Event.deleteMany({});
      await Notice.deleteMany({});

      const dummyPdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      const branches = ['BTECH', 'BBA', 'BCA', 'MBA', 'MCA', 'BCOM', 'MTECH', 'DIPLOMA'];
      
      const subjectNames = [
        ['Mathematics I', 'Physics', 'Chemistry', 'Communication Skills', 'Engineering Graphics', 'Basic Electrical'],
        ['Mathematics II', 'Programming in C', 'Mechanics', 'Environmental Science', 'Workshop Practice', 'Basic Electronics'],
        ['Data Structures', 'Digital Logic', 'Discrete Mathematics', 'Object Oriented Programming', 'Network Analysis', 'Software Engineering'],
        ['Operating Systems', 'Computer Organization', 'Database Management', 'Theory of Computation', 'Microprocessors', 'Web Technologies'],
        ['Computer Networks', 'Design and Analysis of Algorithms', 'Compiler Design', 'Artificial Intelligence', 'Machine Learning', 'Cyber Security'],
        ['Cloud Computing', 'Internet of Things', 'Data Science', 'Mobile App Development', 'Software Testing', 'Big Data Analytics'],
        ['Blockchain Technology', 'Deep Learning', 'Natural Language Processing', 'Human Computer Interaction', 'Information Security', 'Cloud Architecture'],
        ['Major Project', 'Industrial Training', 'Ethics in Engineering', 'Entrepreneurship', 'Disaster Management', 'Organizational Behavior']
      ];

      for (const branch of branches) {
        for (let sem = 1; sem <= 8; sem++) {
          const names = subjectNames[sem - 1];
          for (let i = 0; i < 6; i++) {
            const sub = await Subject.create({
              name: `${names[i]} (${branch})`,
              description: `Core concepts and syllabus for ${names[i]} in Semester ${sem} for ${branch}.`,
              logoUrl: `https://picsum.photos/seed/${names[i].replace(/\s/g, '')}${branch}/200/200`,
              branch: branch,
              semester: sem
            });

            // Add dummy PDF notes for each subject
            await Note.create([
              { title: `${names[i]} Unit 1 Notes`, description: `Introduction to ${names[i]}`, fileUrl: dummyPdf, type: 'Notes', subjectId: sub._id, uploadedBy: adminUser._id },
              { title: `${names[i]} Previous Year Paper`, description: 'PYQ for practice', fileUrl: dummyPdf, type: 'PYQ', subjectId: sub._id, uploadedBy: adminUser._id },
              { title: `${names[i]} Assignment 1`, description: 'First assessment', fileUrl: dummyPdf, type: 'Assignment', subjectId: sub._id, uploadedBy: adminUser._id }
            ]);
          }
        }
      }

      // Add dummy doubts (chats) for some subjects
      // We need a dummy student to ask doubts
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('student123', salt);
      const dummyStudent = await User.create({
        name: 'Dummy Student',
        email: 'student@satyug.edu.in',
        password: hashedPassword,
        role: 'STUDENT',
        branch: 'BTECH',
        semester: 1
      });

      const firstBtechSub = await Subject.findOne({ branch: 'BTECH', semester: 1 });
      if (firstBtechSub) {
        await Chat.deleteMany({});
        await Chat.insertMany([
          { subjectId: firstBtechSub._id, studentId: dummyStudent._id, senderRole: 'STUDENT', message: 'I have a doubt regarding Unit 1.', isReadByTeacher: false },
          { subjectId: firstBtechSub._id, studentId: dummyStudent._id, senderRole: 'STUDENT', message: 'Could you please explain the second topic again?', isReadByTeacher: false }
        ]);
      }

      await Event.create([
        { title: 'Tech Fest 2026', description: 'Annual technology festival of SDIET. Join us for coding competitions and hackathons!', attachmentUrl: dummyPdf, createdBy: adminUser._id },
        { title: 'Guest Lecture on AI', description: 'Industry experts discussing the future of Artificial Intelligence.', attachmentUrl: 'https://picsum.photos/seed/ai/800/600', createdBy: adminUser._id }
      ]);

      await Notice.create([
        { title: 'Semester Exams Schedule', description: 'The mid-semester exams will commence from next week. Please check the attached schedule.', attachmentUrl: dummyPdf, createdBy: adminUser._id },
        { title: 'Holiday Announcement', description: 'College will remain closed on Friday due to a public holiday.', createdBy: adminUser._id }
      ]);
      console.log('Dummy data seeded successfully with 6 subjects per semester.');
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
