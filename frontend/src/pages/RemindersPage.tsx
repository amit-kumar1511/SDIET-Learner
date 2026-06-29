import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import axios from 'axios';
import { Clock, Plus, Trash2, Edit, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { showConfirm } from '../lib/confirm';
import { Skeleton } from '../components/ui/Skeleton';

const BRANCHES = ['ALL', 'Btech CSE', 'Btech CE', 'BCA GEN', 'BCA DS', 'BBA GEN', 'BBA FISB', 'BBA DM'];
const COURSE_SEMESTERS: Record<string, number> = {
  'Btech CSE': 8,
  'Btech CE': 8,
  'BCA GEN': 6,
  'BCA DS': 6,
  'BBA GEN': 6,
  'BBA FISB': 6,
  'BBA DM': 6,
};
const EXPIRY_OPTIONS = [24, 48, 72];

const RemindersPage = () => {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const [reminders, setReminders] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [expandedReminders, setExpandedReminders] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState({
    _id: '',
    title: '',
    content: '',
    branch: 'ALL',
    semester: 'ALL',
    expiryHours: 24
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      const top = notifications[0];
      if (top.type === 'REMINDER_CREATED' || top.type === 'REMINDER_UPDATED') {
        fetchReminders();
      }
    }
  }, [notifications]);

  const fetchReminders = async () => {
    setIsFetching(true);
    try {
      const { data } = await axios.get('/api/reminders');
      setReminders(data);
    } catch (error) {
      toast.error('Failed to fetch reminders');
    } finally {
      setIsFetching(false);
    }
  };

  const handleOpenModal = (reminder?: any) => {
    if (reminder) {
      setFormData({
        _id: reminder._id,
        title: reminder.title,
        content: reminder.content,
        branch: reminder.branch,
        semester: reminder.semester,
        expiryHours: 24, // Reset to 24 or keep logic to calc remaining
      });
    } else {
      setFormData({
        _id: '',
        title: '',
        content: '',
        branch: 'ALL',
        semester: 'ALL',
        expiryHours: 24
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (formData._id) {
        await axios.put(`/api/reminders/${formData._id}`, formData);
        toast.success('Reminder updated successfully');
      } else {
        await axios.post('/api/reminders', formData);
        toast.success('Reminder created successfully');
      }
      setIsModalOpen(false);
      fetchReminders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save reminder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm({
      message: 'Are you sure you want to delete this reminder?',
      confirmText: 'Delete Reminder',
      onConfirm: async () => {
        const loadingToast = toast.loading('Deleting reminder...');
        try {
          await axios.delete(`/api/reminders/${id}`);
          toast.success('Reminder deleted successfully', { id: loadingToast });
          fetchReminders();
        } catch (error) {
          toast.error('Failed to delete reminder', { id: loadingToast });
        }
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Reminders</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Important tasks and deadlines</p>
          </div>
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER') && (
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Reminder
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isFetching ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          ))
        ) : reminders.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 border-dashed">
            <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Active Reminders</h3>
            <p className="text-gray-500 max-w-sm">There are no reminders at the moment.</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div key={reminder._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/30 overflow-hidden relative transition-all hover:shadow-md">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <div className="p-5 pl-7">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2 pr-4 leading-snug">
                    {reminder.title}
                  </h3>
                  {(user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER') && (
                    <div className="flex space-x-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenModal(reminder)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Edit Reminder"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(reminder._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete Reminder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <p className={`text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap ${!expandedReminders[reminder._id] ? 'line-clamp-4' : ''}`}>
                    {reminder.content}
                  </p>
                  {(reminder.content.length > 150 || reminder.content.split('\n').length > 4) && (
                    <button 
                      onClick={() => setExpandedReminders(prev => ({ ...prev, [reminder._id]: !prev[reminder._id] }))}
                      className="text-indigo-600 dark:text-indigo-400 text-xs font-medium mt-1 hover:underline inline-block"
                    >
                      {expandedReminders[reminder._id] ? 'Show less' : 'Show all'}
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-2 border-t border-gray-50 dark:border-gray-700/40">
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>By: {reminder.createdBy?.name}</span>
                  </div>
                  <div>
                    Expires: {new Date(reminder.expiryDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {formData._id ? 'Edit Reminder' : 'Create Reminder'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Heading / Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white"
                  placeholder="E.g., Fee Submission Deadline"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Content</label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white resize-none"
                  placeholder="Reminder details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Branch</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => {
                      const newBranch = e.target.value;
                      const maxSem = newBranch === 'ALL' ? 8 : (COURSE_SEMESTERS[newBranch] || 8);
                      const currentSem = formData.semester;
                      let adjustedSem = currentSem;
                      if (currentSem !== 'ALL' && Number(currentSem) > maxSem) {
                        adjustedSem = 'ALL';
                      }
                      setFormData({ 
                        ...formData, 
                        branch: newBranch,
                        semester: adjustedSem
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900 dark:text-white"
                  >
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900 dark:text-white"
                  >
                    {(formData.branch === 'ALL' 
                      ? ['ALL', '1', '2', '3', '4', '5', '6', '7', '8'] 
                      : ['ALL', ...Array.from({ length: COURSE_SEMESTERS[formData.branch] || 8 }, (_, i) => String(i + 1))]
                    ).map(s => (
                      <option key={s} value={s}>{s === 'ALL' ? 'ALL' : `Sem ${s}`}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Expiry Hours</label>
                <select
                  value={formData.expiryHours}
                  onChange={(e) => setFormData({ ...formData, expiryHours: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900 dark:text-white"
                >
                  {EXPIRY_OPTIONS.map(h => <option key={h} value={h}>{h} Hours</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-2">After this time, the reminder will automatically disappear.</p>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
                >
                  {isLoading ? 'Saving...' : (formData._id ? 'Update Reminder' : 'Create Reminder')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindersPage;
