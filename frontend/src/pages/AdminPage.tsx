import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, X, BookOpen, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { showConfirm } from '../lib/confirm';
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

const AdminPage = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'directory' | 'assignments'>('directory');
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Assignment state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentForm, setAssignmentForm] = useState({
    teacherId: '',
    branch: 'Btech CSE',
    semester: 1,
    selectedSubjectIds: [] as string[]
  });
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [expandedTeachers, setExpandedTeachers] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    subjectName: '',
    authorizedBranches: [] as string[],
    authorizedSemesters: [] as number[],
  });

  useEffect(() => {
    fetchTeachers();
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchAvailableSubjects();
    }
  }, [assignmentForm.branch, assignmentForm.semester, activeTab]);

  const fetchTeachers = async () => {
    setIsLoadingTeachers(true);
    try {
      const { data } = await axios.get('/api/auth/teachers');
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load teachers');
      setTeachers([]);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const fetchAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const { data } = await axios.get('/api/assignments');
      setAssignments(data);
    } catch (error) {
      console.error('Failed to load assignments');
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const fetchAvailableSubjects = async () => {
    setIsLoadingSubjects(true);
    try {
      const { data } = await axios.get(`/api/subjects?branch=${assignmentForm.branch}&semester=${assignmentForm.semester}`);
      setAvailableSubjects(data);
    } catch (error) {
      console.error('Failed to load subjects');
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      await axios.post('/api/auth/teacher', formData);
      toast.success('Teacher registered successfully');
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', subjectName: '', authorizedBranches: [], authorizedSemesters: [] });
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAssignSubjects = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.teacherId || assignmentForm.selectedSubjectIds.length === 0) {
      return toast.error('Please select teacher and at least one subject');
    }

    setIsAssigning(true);
    try {
      await axios.post('/api/assignments', {
        teacherId: assignmentForm.teacherId,
        branch: assignmentForm.branch,
        semester: assignmentForm.semester,
        subjectIds: assignmentForm.selectedSubjectIds
      });
      toast.success('Subjects assigned successfully');
      setAssignmentForm(prev => ({ ...prev, selectedSubjectIds: [] }));
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to assign subjects');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    console.log('Frontend: Requesting removal for assignment ID:', id);
    if (!id) {
      console.error('Frontend Error: No ID provided to handleRemoveAssignment');
      toast.error('Invalid Assignment ID');
      return;
    }

    showConfirm({
      message: 'Are you sure you want to remove this subject assignment? This action cannot be undone.',
      confirmText: 'Remove',
      onConfirm: async () => {
        const loadingToast = toast.loading('Removing assignment...');
        try {
          console.log(`Frontend: Sending DELETE request to /api/assignments/${id}`);
          const response = await axios.delete(`/api/assignments/${id}`);
          console.log('Frontend: Delete response:', response.data);
          toast.dismiss(loadingToast);
          fetchAssignments();
        } catch (error: any) {
          console.error('Frontend: Delete operation failed', error);
          const message = error.response?.data?.message || 'Failed to remove assignment';
          toast.error(message, { id: loadingToast });
        }
      }
    });
  };

  const toggleSubjectSelection = (id: string) => {
    setAssignmentForm(prev => ({
      ...prev,
      selectedSubjectIds: prev.selectedSubjectIds.includes(id)
        ? prev.selectedSubjectIds.filter(sid => sid !== id)
        : [...prev.selectedSubjectIds, id]
    }));
  };

  const toggleTeacherExpansion = (email: string) => {
    setExpandedTeachers(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const groupedAssignments = assignments.reduce((acc: any, curr: any) => {
    const teacherId = curr.teacherId?._id;
    if (!teacherId) return acc;
    
    if (!acc[teacherId]) {
      acc[teacherId] = {
        teacher: curr.teacherId,
        items: []
      };
    }
    acc[teacherId].items.push(curr);
    return acc;
  }, {});

  const toggleBranch = (branch: string) => {
    setFormData(prev => ({
      ...prev,
      authorizedBranches: prev.authorizedBranches.includes(branch)
        ? prev.authorizedBranches.filter(b => b !== branch)
        : [...prev.authorizedBranches, branch]
    }));
  };

  const toggleSemester = (sem: number) => {
    setFormData(prev => ({
      ...prev,
      authorizedSemesters: prev.authorizedSemesters.includes(sem)
        ? prev.authorizedSemesters.filter(s => s !== sem)
        : [...prev.authorizedSemesters, sem]
    }));
  };

  const handleDeleteTeacher = async (id: string) => {
    showConfirm({
      message: 'Are you sure you want to remove this teacher? All their subject assignments will be lost.',
      confirmText: 'Remove Teacher',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/auth/teacher/${id}`);
          setSelectedTeacher(null);
          fetchTeachers();
        } catch (error) {
          toast.error('Failed to remove teacher');
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        {activeTab === 'directory' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Register Teacher
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'directory' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500'
          }`}
        >
          Teacher Directory
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'assignments' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500'
          }`}
        >
          Assign Subjects
        </button>
      </div>

      {activeTab === 'directory' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Teachers Directory</h2>
            <div className="w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
            {isLoadingTeachers ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center space-y-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-3/4 mx-auto rounded" />
                    <Skeleton className="h-3 w-1/2 mx-auto rounded" />
                  </div>
                </div>
              ))
            ) : teachers.filter(t => 
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                t.email.toLowerCase().includes(searchQuery.toLowerCase())
              ).length > 0 ? (
              teachers
                .filter(t => 
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  t.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(teacher => (
                  <div
                    key={teacher._id}
                    onClick={() => setSelectedTeacher(teacher)}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow text-center animate-in fade-in duration-200"
                  >
                    <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                      {teacher.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{teacher.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{teacher.email}</p>
                  </div>
                ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 font-medium">
                No teachers found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assignment Form */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <GraduationCap className="w-6 h-6 mr-2 text-indigo-600" /> New Assignment
            </h2>
            <form onSubmit={handleAssignSubjects} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Teacher</label>
                <select
                  value={assignmentForm.teacherId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, teacherId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a teacher...</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                  <select
                    value={assignmentForm.branch}
                    onChange={(e) => {
                      const newBranch = e.target.value;
                      const maxSem = COURSE_SEMESTERS[newBranch] || 8;
                      const currentSem = assignmentForm.semester;
                      setAssignmentForm({ 
                        ...assignmentForm, 
                        branch: newBranch, 
                        semester: currentSem > maxSem ? maxSem : currentSem,
                        selectedSubjectIds: [] 
                      });
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                  <select
                    value={assignmentForm.semester}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, semester: Number(e.target.value), selectedSubjectIds: [] })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Array.from({ length: COURSE_SEMESTERS[assignmentForm.branch] || 8 }, (_, i) => i + 1).map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Subjects</label>
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-100 dark:border-gray-700 rounded-lg">
                  {isLoadingSubjects ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="flex items-center p-2 space-x-3">
                        <Skeleton className="w-4 h-4 rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                      </div>
                    ))
                  ) : (
                    availableSubjects.map(subject => {
                      const isAlreadyAssigned = assignments.some((a: any) => {
                        const tId = typeof a.teacherId === 'object' ? a.teacherId?._id : a.teacherId;
                        const sId = typeof a.subjectId === 'object' ? a.subjectId?._id : a.subjectId;
                        return tId === assignmentForm.teacherId && sId === subject._id;
                      });

                      return isAlreadyAssigned ? (
                        <div key={subject._id} className="flex items-center p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg cursor-not-allowed border border-blue-100/40 dark:border-blue-900/30">
                          <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/20">
                            <svg className="w-3 h-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="ml-3 text-sm font-semibold text-blue-750 dark:text-blue-400 flex-grow select-none">{subject.name}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full select-none">Assigned</span>
                        </div>
                      ) : (
                        <label key={subject._id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={assignmentForm.selectedSubjectIds.includes(subject._id)}
                            onChange={() => toggleSubjectSelection(subject._id)}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{subject.name}</span>
                        </label>
                      );
                    })
                  )}
                  {!isLoadingSubjects && availableSubjects.length === 0 && (
                    <div className="text-center py-4 text-xs text-gray-500">No subjects found for this selection.</div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isAssigning}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isAssigning ? 'Assigning...' : 'Assign Selected Subjects'}
              </button>
            </form>
          </div>

          {/* Assignment Table */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-indigo-600" /> Active Assignments
              </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoadingAssignments ? (
                [1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-48 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded" />
                  </div>
                ))
              ) : (
                Object.values(groupedAssignments).map((group: any) => (
                  <div key={group.teacher._id} className="transition-colors">
                    <div 
                      onClick={() => toggleTeacherExpansion(group.teacher._id)}
                      className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-900/30"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                          {group.teacher.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{group.teacher.name}</div>
                          <div className="text-xs text-gray-500">{group.teacher.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                          {group.items.length} Subjects
                        </span>
                        {expandedTeachers.includes(group.teacher._id) ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {expandedTeachers.includes(group.teacher._id) && (
                      <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                        <div className="overflow-hidden border border-gray-100 dark:border-gray-700 rounded-xl">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                              <tr>
                                <th className="px-4 py-2">Branch/Sem</th>
                                <th className="px-4 py-2">Subject Name</th>
                                <th className="px-4 py-2 text-right">Delete</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                              {[...group.items].sort((a: any, b: any) => a.semester - b.semester).map((a: any) => (
                                <tr key={a._id} className="text-sm">
                                  <td className="px-4 py-3">
                                    <span className="text-indigo-600 font-bold mr-2">{a.branch}</span>
                                    <span className="text-gray-400">S{a.semester}</span>
                                  </td>
                                  <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                                    {a.subjectId?.name}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await handleRemoveAssignment(a._id);
                                      }}
                                      title="Delete mapping"
                                      className="text-red-400 hover:text-white hover:bg-red-500 p-1.5 rounded-lg transition-all active:scale-95"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {!isLoadingAssignments && Object.keys(groupedAssignments).length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  No assignments mapped yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Details Popup (existing but kept) */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setSelectedTeacher(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                {selectedTeacher.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTeacher.name}</h2>
              <p className="text-gray-500 dark:text-gray-400">{selectedTeacher.email}</p>
            </div>
            
            {/* Active Assignments */}
            <div className="mb-8">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                Authorized Assignments
              </h4>
              {assignments.filter((a: any) => a.teacherId?._id === selectedTeacher?._id).length > 0 ? (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {assignments
                    .filter((a: any) => a.teacherId?._id === selectedTeacher?._id)
                    .sort((a: any, b: any) => a.semester - b.semester)
                    .map((assignment: any) => (
                      <div key={assignment._id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-150 dark:border-gray-700 flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-[9px] font-extrabold uppercase">
                              {assignment.branch}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-505 font-bold">
                              Sem {assignment.semester}
                            </span>
                          </div>
                          <h5 className="font-bold text-gray-800 dark:text-gray-200 text-xs mt-0.5">
                            {assignment.subjectId?.name}
                          </h5>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">No assignments configured yet.</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={() => handleDeleteTeacher(selectedTeacher._id)}
                className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Remove Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-xl my-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Register Teacher</h2>
            <form onSubmit={handleRegisterTeacher} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Subject Name</label>
                  <input
                    type="text"
                    required
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g. Operating Systems"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold"
                >
                  {isRegistering ? 'Registering...' : 'Register Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
