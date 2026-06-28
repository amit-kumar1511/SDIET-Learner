import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Book, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { showConfirm } from '../lib/confirm';
import { Skeleton } from '../components/ui/Skeleton';

const BRANCHES = ['BTECH', 'BBA', 'BCA', 'MBA', 'MCA', 'BCOM', 'MTECH', 'DIPLOMA'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const NotesPage = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(
    user?.role === 'STUDENT' ? user.branch : 'BTECH'
  );
  const [selectedSemester, setSelectedSemester] = useState(
    user?.role === 'STUDENT' ? user.semester : 1
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', description: '', logoUrl: '' });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<any>(null);
  const [confirmNameInput, setConfirmNameInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      setSelectedBranch(user.branch || 'BTECH');
      setSelectedSemester(user.semester || 1);
    }
  }, [user]);

  useEffect(() => {
    fetchSubjects();
  }, [selectedBranch, selectedSemester, user]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const url = user?.role === 'TEACHER' 
        ? '/api/subjects' // Controller already filters by assignments for TEACHER role
        : `/api/subjects?branch=${selectedBranch}&semester=${selectedSemester}`;
      const { data } = await axios.get(url);
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load subjects');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await axios.post('/api/subjects', {
        ...newSubject,
        branch: selectedBranch,
        semester: selectedSemester,
      });
      toast.success('Subject created');
      setIsModalOpen(false);
      setNewSubject({ name: '', description: '', logoUrl: '' });
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to create subject');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (subject: any) => {
    setSubjectToDelete(subject);
    setConfirmNameInput('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectToDelete) return;
    if (confirmNameInput !== subjectToDelete.name) {
      return toast.error('Subject name does not match');
    }

    setIsDeleting(true);
    try {
      await axios.delete(`/api/subjects/${subjectToDelete._id}`);
      toast.success('Subject deleted successfully');
      setIsDeleteModalOpen(false);
      setSubjectToDelete(null);
      setConfirmNameInput('');
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to delete subject');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subjects & Materials</h1>
        {user?.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center shadow-md font-semibold text-sm transition-all active:scale-95 animate-in fade-in"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Subject
          </button>
        )}
      </div>

      {user?.role === 'SUPER_ADMIN' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex flex-wrap gap-2">
            {BRANCHES.map(branch => (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedBranch === branch
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SEMESTERS.map(sem => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSemester === sem
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Sem {sem}
              </button>
            ))}
          </div>
        </div>
      )}

      {user?.role === 'TEACHER' && (
        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
          <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
             Showing your explicitly assigned subjects.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-[160px] flex flex-col justify-between">
              <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
              <div className="space-y-2 flex-grow">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
              </div>
            </div>
          ))
        ) : (
          <>
            {subjects.map(subject => (
              <Link key={subject._id} to={`/subject/${subject._id}`} className="group block">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col relative">
                  {/* Branch and Semester Tags and Delete Button in corner */}
                  <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase">
                      {subject.branch}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-bold whitespace-nowrap">
                      Sem {subject.semester}
                    </span>
                    {user?.role === 'SUPER_ADMIN' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteClick(subject);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 mb-4 pr-24">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      {subject.logoUrl ? (
                        <img src={subject.logoUrl} alt={subject.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <Book className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">{subject.name}</h3>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm flex-grow line-clamp-3">{subject.description}</p>
                </div>
              </Link>
            ))}
            {!loading && subjects.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                No subjects found for this branch and semester.
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-700 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Add New Subject</h2>
            <p className="text-sm text-gray-500 mb-4">
              Creating subject for <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedBranch}</span>, <span className="font-bold text-purple-600 dark:text-purple-400">Semester {selectedSemester}</span>
            </p>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g. Computer Networks"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Subject description..."
                />
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
                  disabled={isCreating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subject Modal */}
      {isDeleteModalOpen && subjectToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-gray-150 dark:border-gray-700 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-3 text-red-600 dark:text-red-400 tracking-tight">Delete Subject</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{subjectToDelete.name}</span>? This action is permanent and will delete all notes, assignments, and doubts.
            </p>
            <form onSubmit={handleConfirmDelete} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">
                  Type the subject name to confirm: <span className="select-all font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded text-sm">{subjectToDelete.name}</span>
                </label>
                <input
                  type="text"
                  required
                  value={confirmNameInput}
                  onChange={(e) => setConfirmNameInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                  placeholder="Enter subject name exactly"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSubjectToDelete(null);
                  }}
                  className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmNameInput !== subjectToDelete.name || isDeleting}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default NotesPage;
