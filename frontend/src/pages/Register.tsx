import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import GoogleButton from '../components/GoogleButton';

const BRANCHES = ['Btech CSE', 'Btech CE', 'BCA GEN', 'BCA DS', 'BBA GEN', 'BBA FISB', 'BBA DM'];
const COURSE_SEMESTERS: Record<string, number> = {
  'Btech CSE': 8, 'Btech CE': 8,
  'BCA GEN': 6, 'BCA DS': 6,
  'BBA GEN': 6, 'BBA FISB': 6, 'BBA DM': 6,
};

interface VerifiedProfile {
  name: string;
  email: string;
  profileImage?: string;
}

const Register = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Phase 1: not yet verified by Google
  // Phase 2: Google verified, completing registration
  const [verifiedProfile, setVerifiedProfile] = useState<VerifiedProfile | null>(null);
  const [registrationToken, setRegistrationToken] = useState('');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    branch: 'Btech CSE',
    semester: 1,
    rollNumber: '',
  });

  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // Accept registration state passed from Login page (Google auth on login → user not registered)
  useEffect(() => {
    const state = location.state as any;
    if (state?.registrationToken && state?.verifiedProfile) {
      setRegistrationToken(state.registrationToken);
      setVerifiedProfile(state.verifiedProfile);
    }
  }, [location.state]);

  // ── Google credential callback ──────────────────────────────────────────
  const handleGoogleCredential = async (credentialResponse: any) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      toast.error('Google authentication failed. Please try again.');
      return;
    }

    setIsVerifying(true);
    try {
      const { data } = await axios.post('/api/auth/google', { credential });

      if (data.requiresRegistration) {
        // New user: enter Phase 2
        setRegistrationToken(data.registrationToken);
        setVerifiedProfile(data.verifiedProfile);
        toast.success('College email verified! Please complete your registration.');
      } else {
        // Already registered: log in directly
        login(data);
        toast.success('Logged in successfully!');
        navigate('/');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (msg?.includes('@satyug.edu.in') || msg?.includes('college')) {
        toast.error('Please use your @satyug.edu.in college Google account.');
      } else if (msg?.includes('verified')) {
        toast.error('Your college account could not be verified.');
      } else {
        toast.error(msg || 'Google authentication failed. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };


  // ── Registration form submit ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registrationToken || !verifiedProfile) {
      toast.error('Please verify your college email with Google first.');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsRegistering(true);
    try {
      const { data } = await axios.post('/api/auth/register', {
        registrationToken,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        branch: formData.branch,
        semester: formData.semester,
        rollNumber: formData.rollNumber,
      });
      login(data);
      toast.success('Registration successful! Welcome to SDIET Learner.');
      navigate('/');
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (msg?.includes('expired') || msg?.includes('verification session')) {
        toast.error('Verification expired. Please verify with Google again.');
        setVerifiedProfile(null);
        setRegistrationToken('');
      } else if (msg?.includes('already exists')) {
        toast.error('An account with this email already exists. Please sign in.');
      } else {
        toast.error(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // ── Shared input class ──────────────────────────────────────────────────
  const inputCls = 'w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm';

  // ── Phase 1: Google verification prompt ────────────────────────────────
  if (!verifiedProfile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center mb-4">
              <span className="text-4xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 leading-none">SDIET</span>
              <span className="text-xs uppercase tracking-[0.4em] font-extrabold text-gray-400 dark:text-gray-500 mt-1">Learner Portal</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Registration</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Create your academic account</p>
          </div>

          {/* Info box */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">College Email Required</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                Only <span className="font-bold">@satyug.edu.in</span> Google Workspace accounts are allowed to register. Your email must be verified through Google.
              </p>
            </div>
          </div>

          {/* Google verify button — custom styled, real GoogleLogin inside */}
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center">
              Click below to verify your <span className="font-bold text-indigo-600 dark:text-indigo-400">@satyug.edu.in</span> college account
            </p>
            <GoogleButton
              onSuccess={handleGoogleCredential}
              isLoading={isVerifying}
              text="Verify College Email with Google"
            />
          </div>

          <p className="mt-6 text-center text-gray-500 dark:text-gray-400 font-medium text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Phase 2: Complete registration form ────────────────────────────────
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex flex-col items-center mb-4">
            <span className="text-4xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 leading-none">SDIET</span>
            <span className="text-xs uppercase tracking-[0.4em] font-extrabold text-gray-400 dark:text-gray-500 mt-1">Learner Portal</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Registration</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Set your Student Learner password</p>
        </div>

        {/* Verified badge */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-3 mb-6 flex items-center gap-3">
          {verifiedProfile.profileImage && (
            <img src={verifiedProfile.profileImage} alt={verifiedProfile.name} className="w-10 h-10 rounded-full object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-green-700 dark:text-green-300 truncate">{verifiedProfile.name}</p>
            <p className="text-xs text-green-600 dark:text-green-400 truncate">{verifiedProfile.email}</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 bg-indigo-600 rounded-full" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Personal Details</h3>
          </div>

          {/* Verified name (read-only) */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
            <input type="text" readOnly value={verifiedProfile.name} className={`${inputCls} bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed text-gray-500 dark:text-gray-400`} />
          </div>

          {/* Verified email (read-only) */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">College Email</label>
            <input type="email" readOnly value={verifiedProfile.email} className={`${inputCls} bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed text-gray-500 dark:text-gray-400`} />
            <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 ml-1 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified by Google
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Website Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Create a password (min 6 chars)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`${inputCls} pr-10`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1 italic">This is your SDIET Learner password — not your Google password.</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`${inputCls} pr-10`}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Branch + Semester */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Branch</label>
              <select
                value={formData.branch}
                onChange={(e) => {
                  const newBranch = e.target.value;
                  const maxSem = COURSE_SEMESTERS[newBranch] || 8;
                  setFormData({ ...formData, branch: newBranch, semester: formData.semester > maxSem ? maxSem : formData.semester });
                }}
                className={`${inputCls} appearance-none`}
              >
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className={`${inputCls} appearance-none`}
              >
                {Array.from({ length: COURSE_SEMESTERS[formData.branch] || 8 }, (_, i) => i + 1).map(s => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Roll Number */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Roll Number</label>
            <input
              type="text"
              required
              pattern="^[A-Z]+-\d{2}/\d{3}$"
              title="Format: CSE-22/016"
              value={formData.rollNumber}
              onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              className={inputCls}
              placeholder="CSE-22/016"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isRegistering}
              className="w-full bg-indigo-600 text-white font-black py-3 px-8 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none active:scale-[0.98] text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRegistering ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : 'Complete Registration'}
            </button>
          </div>

          <p className="text-center text-gray-500 dark:text-gray-400 font-medium text-sm">
            <button
              type="button"
              onClick={() => { setVerifiedProfile(null); setRegistrationToken(''); }}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              ← Use a different Google account
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
