import React, { useEffect, useState } from 'react';
import { User as UserIcon, Mail, Shield, Edit2, Save, X, Hash, GraduationCap } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/ui/Skeleton';

const BRANCHES = ['Btech CSE', 'Btech CE', 'BCA GEN', 'BCA DS', 'BBA GEN', 'BBA FISB', 'BBA DM'];
const COURSE_SEMESTERS: Record<string, number> = {
  'Btech CSE': 8,
  'Btech CE': 8,
  'BCA GEN': 6,
  'BCA DS': 6,
  'BBA GEN': 6,
  'BBA FISB': 6,
  'BBA DM': 6,
};

const StudentsPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [blockLoadingId, setBlockLoadingId] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get('/api/auth/profile');
      setProfile(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load profile context');
    }
  };

  const fetchStudents = async () => {
    if (!profile || (profile.role !== 'SUPER_ADMIN' && profile.role !== 'TEACHER')) return;
    setIsFetchingStudents(true);
    try {
      const { data } = await axios.get('/api/auth/students', {
        params: {
          branch: branchFilter,
          semester: semesterFilter,
          search: searchQuery
        }
      });
      setStudents(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load students list');
    } finally {
      setIsFetchingStudents(false);
    }
  };

  const handleToggleBlock = async (studentId: string, currentBlockStatus: boolean) => {
    setBlockLoadingId(studentId);
    const loadingToast = toast.loading(currentBlockStatus ? 'Unblocking student...' : 'Blocking student...');
    try {
      const { data } = await axios.post(`/api/auth/students/toggle-block/${studentId}`, {
        block: !currentBlockStatus
      });
      toast.success(data.message || 'Status updated successfully', { id: loadingToast });
      setStudents(prev =>
        prev.map(s => (s._id === studentId ? { ...s, isBlocked: !currentBlockStatus } : s))
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status', { id: loadingToast });
    } finally {
      setBlockLoadingId(null);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile && (profile.role === 'SUPER_ADMIN' || profile.role === 'TEACHER')) {
      const delayDebounce = setTimeout(() => {
        fetchStudents();
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [profile, branchFilter, semesterFilter, searchQuery]);

  if (!profile) return <div className="p-8 text-center text-gray-500">Loading student directory context...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Student Directory</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">View and manage student credentials and access rights</p>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest text-[11px] opacity-50">Student Management</h2>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Active Students Registry</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search name, email, roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white min-w-[200px]"
            />

            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => {
                const newBranch = e.target.value;
                setBranchFilter(newBranch);
                const maxSem = newBranch === 'ALL' ? 8 : (COURSE_SEMESTERS[newBranch] || 8);
                if (semesterFilter !== 'ALL' && Number(semesterFilter) > maxSem) {
                  setSemesterFilter('ALL');
                }
              }}
              className="px-3 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white font-bold"
            >
              <option value="ALL">All Branches</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {/* Semester Filter */}
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white font-bold"
            >
              <option value="ALL">All Semesters</option>
              {(branchFilter === 'ALL'
                ? [1, 2, 3, 4, 5, 6, 7, 8]
                : Array.from({ length: COURSE_SEMESTERS[branchFilter] || 8 }, (_, i) => i + 1)
              ).map(s => <option key={s} value={String(s)}>Sem {s}</option>)}
            </select>
          </div>
        </div>

        {/* Student Grid / List */}
        {isFetchingStudents ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-1/3 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 bg-gray-50 dark:bg-gray-800/35 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
            <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-550 font-bold text-sm">No students found matching filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {students.map((student) => (
              <div 
                key={student._id} 
                className={cn(
                  "relative p-4 rounded-xl border transition-all flex flex-col justify-between",
                  student.isBlocked 
                    ? "bg-red-50/20 dark:bg-red-950/10 border-red-200 dark:border-red-900/30" 
                    : "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md"
                )}
              >
                <div>
                  <div className="flex justify-between items-start mb-2 pr-20">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{student.name}</h3>
                    {student.isBlocked && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-[9px] font-black tracking-wide uppercase shrink-0 ml-2">
                        Blocked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate mb-3">{student.email}</p>

                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-[9px] font-bold uppercase">
                      {student.branch}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-[9px] font-bold">
                      Sem {student.semester}
                    </span>
                    {student.rollNumber && (
                      <span className="px-2 py-0.5 bg-gray-150 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full text-[9px] font-bold">
                        {student.rollNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="absolute top-4 right-4 z-10">
                  <button
                    type="button"
                    disabled={blockLoadingId === student._id}
                    onClick={() => handleToggleBlock(student._id, student.isBlocked)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50",
                      student.isBlocked
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "border border-red-200 text-red-600 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20"
                    )}
                  >
                    {student.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsPage;
