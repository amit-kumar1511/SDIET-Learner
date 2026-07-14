import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendTeacherMail } from '../utils/sendEmail.js';
import { Otp } from '../models/Otp.js';
import { sendEmail } from '../utils/sendEmail.js';

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'satyug.edu.in';
const REGISTRATION_TOKEN_SECRET = process.env.REGISTRATION_TOKEN_SECRET || 'reg_token_fallback_secret_change_me';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helper: verify Google ID token ────────────────────────────────────────
async function verifyGoogleToken(credential: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

// ─── Helper: validate that payload belongs to college domain ───────────────
function validateCollegePayload(payload: any): string | null {
  if (!payload || !payload.sub || !payload.email) return 'Invalid Google token payload.';
  if (payload.email_verified !== true) return 'Your college Google email is not verified.';
  if (!payload.email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
    return `Please use your @${ALLOWED_DOMAIN} college Google account.`;
  }
  if (payload.hd?.toLowerCase() !== ALLOWED_DOMAIN) {
    return `Please use your @${ALLOWED_DOMAIN} college Google account.`;
  }
  return null; // valid
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/google
// Handles both login (existing user) and returns a registrationToken (new user)
// ─────────────────────────────────────────────────────────────────────────────
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error('Google credential is required.');
  }

  let payload: any;
  try {
    payload = await verifyGoogleToken(credential);
  } catch {
    res.status(401);
    throw new Error('Google authentication failed. Please try again.');
  }

  const validationError = validateCollegePayload(payload);
  if (validationError) {
    res.status(403);
    throw new Error(validationError);
  }

  const googleId: string = payload.sub;
  const email: string = payload.email.toLowerCase().trim();
  const name: string = payload.name || '';
  const profileImage: string = payload.picture || '';

  // Find existing user by googleId or verified email
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    // ── Existing user: link Google if not already linked ──────────────────
    let changed = false;
    if (!user.googleId) { user.googleId = googleId; changed = true; }
    if (!user.profileImage && profileImage) { user.profileImage = profileImage; changed = true; }
    if (!user.authProviders.includes('google')) { user.authProviders.push('google'); changed = true; }
    if (!user.isEmailVerified) { user.isEmailVerified = true; changed = true; }
    if (changed) await user.save();

    if (user.isBlocked) {
      res.status(403);
      throw new Error('Your account has been blocked. Please contact the administrator.');
    }

    res.json({
      success: true,
      requiresRegistration: false,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      semester: user.semester,
      authorizedBranches: user.authorizedBranches,
      authorizedSemesters: user.authorizedSemesters,
      profileImage: user.profileImage,
      token: generateToken(user._id.toString()),
    });
    return;
  }

  // ── New user: return a short-lived registration token ───────────────────────
  const registrationToken = jwt.sign(
    { sub: googleId, email, name, profileImage, purpose: 'college-registration' },
    REGISTRATION_TOKEN_SECRET,
    { expiresIn: '10m' }
  );

  res.status(200).json({
    success: true,
    requiresRegistration: true,
    registrationToken,
    verifiedProfile: { name, email, profileImage },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Completes registration using a verified registrationToken from Google flow
// ─────────────────────────────────────────────────────────────────────────────
export const registerStudent = asyncHandler(async (req: Request, res: Response) => {
  const { registrationToken, password, confirmPassword, branch, semester, rollNumber } = req.body;

  if (!registrationToken || !password || !confirmPassword) {
    res.status(400);
    throw new Error('Registration token, password, and confirm password are required.');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters.');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match.');
  }

  // Verify registration token
  let tokenPayload: any;
  try {
    tokenPayload = jwt.verify(registrationToken, REGISTRATION_TOKEN_SECRET);
  } catch {
    res.status(401);
    throw new Error('Your verification session has expired. Please verify with Google again.');
  }

  if (tokenPayload.purpose !== 'college-registration') {
    res.status(401);
    throw new Error('Invalid registration token.');
  }

  const { sub: googleId, email, name, profileImage } = tokenPayload;

  // Roll number validation
  const rollRegex = /^[A-Z]+-\d{2}\/\d{3}$/;
  if (rollNumber && !rollRegex.test(rollNumber)) {
    res.status(400);
    throw new Error('Invalid roll number format. Example: CSE-22/016');
  }

  // Check for duplicate
  const existingUser = await User.findOne({ $or: [{ email }, { googleId }] });
  if (existingUser) {
    res.status(409);
    throw new Error('An account with this email already exists. Please sign in.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'STUDENT',
    branch,
    semester: semester ? Number(semester) : undefined,
    rollNumber,
    googleId,
    profileImage: profileImage || '',
    authProviders: ['google', 'local'],
    isEmailVerified: true,
    collegeDomain: ALLOWED_DOMAIN,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      semester: user.semester,
      profileImage: user.profileImage,
      token: generateToken(user._id.toString()),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data. Registration failed.');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login  (email + website password)
// ─────────────────────────────────────────────────────────────────────────────
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const rawEmail = req.body.email;
  const { password } = req.body;

  if (!rawEmail || !password) {
    res.status(400);
    throw new Error('Email and password are required.');
  }

  const email = rawEmail.trim().toLowerCase();

  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error('Your account has been blocked. Please contact the administrator.');
  }

  // Google-only user with no website password cannot use password login
  if (!user.password || user.authProviders.includes('google') && !user.authProviders.includes('local')) {
    res.status(401);
    throw new Error('This account uses Google sign-in. Please click "Continue with Google" to log in.');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    res.status(401);
    throw new Error('Invalid email or password.');
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
    profileImage: user.profileImage,
    token: generateToken(user._id.toString()),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const user = await User.findById(req.user._id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
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
      // Ensure local is in authProviders
      if (!user.authProviders.includes('local')) {
        user.authProviders.push('local');
      }
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
      profileImage: updatedUser.profileImage,
      token: generateToken(updatedUser._id.toString()),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/teacher  (Admin only)
// ─────────────────────────────────────────────────────────────────────────────
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
    authProviders: ['local'],
    isEmailVerified: true,
  });

  if (user) {
    sendTeacherMail({
      to: user.email,
      password,
      subjectName: subjectName || 'N/A'
    }).catch(err => console.error('Error sending teacher welcome mail in background:', err));

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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/teachers
// ─────────────────────────────────────────────────────────────────────────────
export const getTeachers = asyncHandler(async (req: Request, res: Response) => {
  const teachers = await User.find({ role: 'TEACHER' }).select('-password');
  res.json(teachers);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/auth/teacher/:id
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/students
// ─────────────────────────────────────────────────────────────────────────────
export const getStudents = asyncHandler(async (req: any, res: Response) => {
  const { branch, semester, search } = req.query;

  let query: any = { role: 'STUDENT' };

  if (branch && branch !== 'ALL') query.branch = branch;
  if (semester && semester !== 'ALL') query.semester = parseInt(semester);

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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/students/toggle-block/:id
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password  (kept — OTP-based password reset)
// ─────────────────────────────────────────────────────────────────────────────
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

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password  (kept — OTP-based password reset)
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error('Please fill all required fields');
  }

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

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  if (!user.authProviders.includes('local')) {
    user.authProviders.push('local');
  }
  await user.save();

  await Otp.deleteOne({ _id: otpRecord._id });

  res.status(200).json({ message: 'Password reset successfully' });
});
