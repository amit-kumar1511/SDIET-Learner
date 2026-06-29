import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { Send, Eye, EyeOff } from 'lucide-react';

const BRANCHES = ['BTECH', 'BBA', 'BCA', 'MBA', 'MCA', 'BCOM', 'MTECH', 'DIPLOMA'];
const COURSE_SEMESTERS: Record<string, number> = {
  BTECH: 8,
  BBA: 6,
  BCA: 6,
  MBA: 4,
  MCA: 6,
  BCOM: 6,
  MTECH: 4,
  DIPLOMA: 6,
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    branch: 'BTECH',
    semester: 1,
    rollNumber: '',
    otp: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSendOtp = async () => {
    if (!formData.email.endsWith('@satyug.edu.in')) {
      toast.error('Email must end with @satyug.edu.in');
      return;
    }

    try {
      setIsSendingOtp(true);
      await axios.post('/api/auth/send-otp', { email: formData.email });
      setOtpSent(true);
      toast.success('OTP sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!otpSent) {
       toast.error('Please verify your email with OTP first');
       return;
     }
     
     setIsRegistering(true);
     try {
       const payload = {
         ...formData,
         role: 'STUDENT'
       };
       const { data } = await axios.post('/api/auth/register', payload);
       login(data);
       toast.success('Registration successful');
       navigate('/');
     } catch (error: any) {
       toast.error(error.response?.data?.message || 'Registration failed');
     } finally {
       setIsRegistering(false);
     }
   };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-4">
            <span className="text-4xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 leading-none">SDIET</span>
            <span className="text-xs uppercase tracking-[0.4em] font-extrabold text-gray-400 dark:text-gray-500 mt-1">Learner Portal</span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Student Registration
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Create your academic account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-8">
            {/* Basic Info Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-5 bg-indigo-600 rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Personal Details</h3>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">College Email</label>
                <div className="relative group">
                  <input
                    type="email"
                    required
                    pattern=".*@satyug\.edu\.in$"
                    title="Must end with @satyug.edu.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-14"
                    placeholder="name@satyug.edu.in"
                    disabled={otpSent}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || !formData.email || otpSent}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:bg-gray-400 group-hover:scale-105 active:scale-95"
                  >
                    <Send className={cn("w-4 h-4", isSendingOtp && "animate-pulse")} />
                  </button>
                </div>
                {!otpSent && (
                  <p className="text-[10px] text-gray-400 mt-1.5 ml-1 italic font-medium italic">Click the icon to receive a 4-digit verification code.</p>
                )}
              </div>

              {otpSent && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 ml-1">Account Verification (OTP)</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="Enter 4-digit code"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-900/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center tracking-[1em] text-xl font-black"
                  />
                  <p className="text-[10px] text-indigo-500 mt-1.5 ml-1 font-bold flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                    Verification code sent to {formData.email}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Branch</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                  >
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                  >
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Roll Number</label>
                <input
                  type="text"
                  required
                  pattern="^[A-Z]+-\d{2}/\d{3}$"
                  title="Format: CSE-22/016"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="CSE-22/016"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!otpSent || isRegistering}
              className="w-full bg-indigo-600 text-white font-black py-4 px-8 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none active:scale-[0.98] text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isRegistering ? 'Registering...' : (otpSent ? 'Complete Registration' : 'Verify Email First')}
            </button>
            <p className="mt-8 text-center text-gray-500 dark:text-gray-400 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
