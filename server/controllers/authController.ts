import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendEmail, sendTeacherMail } from '../utils/sendEmail.js';
import { Otp } from '../models/Otp.js';

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email');
  }

  // Generate 4 digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Save/Update OTP in DB
  await Otp.findOneAndUpdate(
    { email },
    { otp, createdAt: new Date() },
    { upsert: true, new: true }
  );

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #2c3e50; text-align: center;">Registration OTP 🔐</h2>
      <p style="font-size: 16px; color: #34495e;">Use the following OTP to complete your registration:</p>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #4f46e5; margin: 0;">${otp}</h1>
      </div>
      <p style="font-size: 14px; color: #7f8c8d; text-align: center;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
    </div>
  `;

  await sendEmail(email, 'Your Registration OTP', html);

  res.status(200).json({ message: 'OTP sent successfully' });
});

export const registerStudent = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, branch, semester, rollNumber, otp } = req.body;

  if (!email.endsWith('@satyug.edu.in')) {
    res.status(400);
    throw new Error('Email must end with @satyug.edu.in');
  }

  const rollRegex = /^[A-Z]+-\d{2}\/\d{3}$/;
  if (!rollRegex.test(rollNumber)) {
    res.status(400);
    throw new Error('Invalid roll number format. Example: CSE-22/016');
  }

  if (!otp) {
    res.status(400);
    throw new Error('Please provide OTP');
  }

  // Verify OTP
  const otpRecord = await Otp.findOne({ email, otp });
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'STUDENT',
    branch,
    semester,
    rollNumber,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      semester: user.semester,
      token: generateToken(user._id.toString()),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    if (user.isBlocked) {
      res.status(403);
      throw new Error('Your account has been blocked. Please contact the administrator.');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      semester: user.semester,
      authorizedBranches: user.authorizedBranches,
      authorizedSemesters: user.authorizedSemesters,
      token: generateToken(user._id.toString()),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const user = await User.findById(req.user._id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export const updateProfile = asyncHandler(async (req: any, res: Response) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    
    if (user.role === 'STUDENT') {
      user.semester = req.body.semester || user.semester;
      user.rollNumber = req.body.rollNumber || user.rollNumber;

      if (req.body.rollNumber) {
        const rollRegex = /^[A-Z]+-\d{2}\/\d{3}$/;
        if (!rollRegex.test(req.body.rollNumber)) {
          res.status(400);
          throw new Error('Invalid roll number format. Example: CSE-22/016');
        }
      }
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      branch: updatedUser.branch,
      semester: updatedUser.semester,
      authorizedBranches: updatedUser.authorizedBranches,
      authorizedSemesters: updatedUser.authorizedSemesters,
      token: generateToken(updatedUser._id.toString()),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export const registerTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, authorizedBranches, authorizedSemesters, subjectName } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'TEACHER',
    authorizedBranches,
    authorizedSemesters,
  });

  if (user) {
    sendTeacherMail({
      to: user.email,
      password,
      subjectName: subjectName || 'N/A'
    }).catch(err => console.error("Error sending teacher welcome mail in background:", err));

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

export const getTeachers = asyncHandler(async (req: Request, res: Response) => {
  const teachers = await User.find({ role: 'TEACHER' }).select('-password');
  res.json(teachers);
});

export const deleteTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await User.findById(req.params.id);
  if (teacher) {
    await User.deleteOne({ _id: teacher._id });
    res.json({ message: 'Teacher removed' });
  } else {
    res.status(404);
    throw new Error('Teacher not found');
  }
});

export const getStudents = asyncHandler(async (req: any, res: Response) => {
  const { branch, semester, search } = req.query;

  let query: any = { role: 'STUDENT' };

  // Branch filter
  if (branch && branch !== 'ALL') {
    query.branch = branch;
  }

  // Semester filter
  if (semester && semester !== 'ALL') {
    query.semester = parseInt(semester);
  }

  // Text search
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } }
    ];
  }

  const students = await User.find(query).select('-password').sort({ name: 1 });
  res.json(students);
});

export const toggleBlockUser = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { block } = req.body;

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'SUPER_ADMIN') {
    res.status(403);
    throw new Error('Cannot block/unblock administrators');
  }

  if (req.user.role === 'TEACHER') {
    if (user.role !== 'STUDENT') {
      res.status(403);
      throw new Error('Teachers can only block/unblock students');
    }
  }

  user.isBlocked = block;
  await user.save();

  res.json({ message: `User ${block ? 'blocked' : 'unblocked'} successfully`, user });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email');
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User with this email does not exist');
  }

  // Generate 4 digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Save/Update OTP in DB
  await Otp.findOneAndUpdate(
    { email },
    { otp, createdAt: new Date() },
    { upsert: true, new: true }
  );

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #2c3e50; text-align: center;">Reset Password OTP 🔐</h2>
      <p style="font-size: 16px; color: #34495e;">Use the following OTP to reset your password:</p>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #4f46e5; margin: 0;">${otp}</h1>
      </div>
      <p style="font-size: 14px; color: #7f8c8d; text-align: center;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
    </div>
  `;

  await sendEmail(email, 'Your Reset Password OTP', html);

  res.status(200).json({ message: 'Password reset OTP sent successfully' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error('Please fill all required fields');
  }

  // Verify OTP
  const otpRecord = await Otp.findOne({ email, otp });
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  await user.save();

  // Delete OTP record after successful reset
  await Otp.deleteOne({ _id: otpRecord._id });

  res.status(200).json({ message: 'Password reset successfully' });
});
