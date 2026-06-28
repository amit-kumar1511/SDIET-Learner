import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Mail, BookOpen, Calendar, Shield, Edit2, Save, X, Hash, LogOut } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    semester: 1,
    rollNumber: '',
  });

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get('/api/auth/profile');
      setProfile(data);
      setFormData({
        name: data.name,
        email: data.email,
        semester: data.semester || 1,
        rollNumber: data.rollNumber || '',
      });
      if (data.role === 'TEACHER') {
        const res = await axios.get(`/api/assignments/teacher/${data._id}`);
        const sorted = (res.data || []).sort((a: any, b: any) => a.semester - b.semester);
        setAssignments(sorted);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.put('/api/auth/profile', formData);
      setProfile(data);
      login(data); // Update global state
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      // After semester update, reload might be needed for other components to catch up
      // though context update should handle it in most places.
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <form onSubmit={handleUpdate} className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-indigo-600 h-32"></div>
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-start">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center text-4xl font-bold text-indigo-600 dark:text-indigo-400 -mt-12 mb-4">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="mt-4 p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-600 dark:text-gray-300 flex items-center space-x-1 text-sm font-bold"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1 text-gray-400/60">Email (Cannot be changed)</label>
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-450 dark:text-gray-500 cursor-not-allowed outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{profile.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 flex items-center mt-2 font-medium">
                <Mail className="w-4 h-4 mr-2" /> {profile.email}
              </p>
              <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800">
                <Shield className="w-4 h-4 mr-2" /> {profile.role.replace('_', ' ')}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-[11px] opacity-50">Academic Credentials</h2>
        
        {profile.role === 'STUDENT' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Branch</p>
                  <p className="font-black text-gray-900 dark:text-white">{profile.branch}</p>
                </div>
              </div>
            </div>

            <div className="group p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Semester</p>
                  {isEditing ? (
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                      className="w-full mt-1 bg-transparent border-none p-0 focus:ring-0 text-gray-900 dark:text-white font-black"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-black text-gray-900 dark:text-white">{profile.semester}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="group p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl lg:col-span-1">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                  <Hash className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Roll Number</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value.toUpperCase() })}
                      className="w-full mt-1 bg-transparent border-none p-0 focus:ring-0 text-gray-900 dark:text-white font-black placeholder:text-gray-300"
                      placeholder="e.g. CSE-22/016"
                    />
                  ) : (
                    <p className="font-black text-gray-900 dark:text-white">{profile.rollNumber || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Authorized Assignments</h3>
              {assignments && assignments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assignments.map((assignment: any) => (
                    <div key={assignment._id} className="group p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:bg-white dark:hover:bg-gray-850 hover:shadow-xl flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded text-[10px] font-black tracking-wide uppercase">
                            {assignment.branch}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-505 font-bold">
                            Semester {assignment.semester}
                          </span>
                        </div>
                        <h4 className="font-black text-gray-900 dark:text-white text-sm mt-1.5">
                          {assignment.subjectId?.name}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-550 italic ml-1">No assignments configured yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save / Cancel Changes Buttons at the bottom */}
      {isEditing && (
        <div className="flex justify-center space-x-4 mt-6">
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setFormData({
                name: profile.name,
                email: profile.email,
                semester: profile.semester || 1,
                rollNumber: profile.rollNumber || '',
              });
            }}
            className="px-8 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center space-x-2 shadow-sm"
          >
            <X className="w-5 h-5" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center space-x-2 disabled:opacity-50 shadow-sm"
          >
            {loading ? <span>Saving...</span> : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Logout Button */}
      <div className="flex justify-center pb-6 mt-6">
        <button
          type="button"
          onClick={() => setShowLogoutDialog(true)}
          className="flex items-center space-x-2 px-8 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all hover:shadow-md active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutDialog(false)}
          />
          {/* Dialog */}
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
            </div>
            {/* Text */}
            <h2 className="text-xl font-black text-gray-900 dark:text-white text-center mb-2">
              Log Out?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8">
              Kya aap sure hain ki aap log out karna chahte hain?
            </p>
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                  toast.success('Successfully logged out!');
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all hover:shadow-lg active:scale-95"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default ProfilePage;
