import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Plus, X, Trash2, Edit2, Download, Share2, Copy, FileText, 
  CheckCircle2, Clock, PlayCircle, Eye, Bold, Italic, Underline, 
  List, ListOrdered, Sparkles, ChevronRight, AlertCircle, FileDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { showConfirm } from '../lib/confirm';
import { Skeleton } from '../components/ui/Skeleton';

// Map database categories/statuses to pretty UI text and styles
const categoryMap: Record<string, string> = {
  today: 'Today Plan',
  seven_days: '7 Days Plan',
  one_month: '1 Month Plan',
  six_months: '6 Months Plan',
  one_year: '1 Year Plan',
  custom: 'Custom Plan'
};

const categoryBadgeStyles: Record<string, string> = {
  today: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30',
  seven_days: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30',
  one_month: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30',
  six_months: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/30',
  one_year: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/30',
  custom: 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/30'
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed'
};

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/40',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/40',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/40'
};

const getLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDurationText = (startStr: string, endStr: string) => {
  if (!startStr || !endStr) return '';
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
  
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  
  if (end < start) return '0 Days';
  
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  
  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);
  
  return parts.join(', ');
};

const getRemainingTimeText = (targetDateStr: string, status: string) => {
  if (!targetDateStr) return '';
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return '';
  
  const today = new Date();
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  
  if (status === 'completed') {
    return 'Completed';
  }
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return `Overdue by ${overdueDays} ${overdueDays === 1 ? 'Day' : 'Days'}`;
  } else if (diffDays === 0) {
    return 'Due Today';
  } else {
    let years = target.getFullYear() - today.getFullYear();
    let months = target.getMonth() - today.getMonth();
    let days = target.getDate() - today.getDate();
    
    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += prevMonth.getDate();
    }
    
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    
    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'mo' : 'mos'}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    
    return `${parts.join(', ')} remaining`;
  }
};

const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'seven_days', label: '7 Days' },
  { id: 'one_month', label: '1 Month' },
  { id: 'six_months', label: '6 Months' },
  { id: 'one_year', label: '1 Year' },
  { id: 'custom', label: 'Custom' },
  { id: 'completed', label: 'Completed' },
  { id: 'pending', label: 'Pending' }
];

export default function StudentPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [viewingPlan, setViewingPlan] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rich Text Editor State
  const editorRef = useRef<HTMLDivElement>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    category: 'today',
    startDate: getLocalDateString(),
    targetDate: getLocalDateString(),
    content: '',
    plainTextContent: '',
    status: 'pending'
  });

  const handleCategoryChange = (category: string) => {
    const today = new Date();
    let target = new Date();

    if (category === 'today') {
      // Keep today
    } else if (category === 'seven_days') {
      target.setDate(today.getDate() + 7);
    } else if (category === 'one_month') {
      target.setMonth(today.getMonth() + 1);
    } else if (category === 'six_months') {
      target.setMonth(today.getMonth() + 6);
    } else if (category === 'one_year') {
      target.setFullYear(today.getFullYear() + 1);
    }

    setForm(prev => {
      const todayStr = getLocalDateString(today);
      const targetStr = category === 'custom' ? prev.targetDate : getLocalDateString(target);
      return {
        ...prev,
        category,
        startDate: todayStr,
        targetDate: targetStr
      };
    });
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Initialize contentEditable editor innerHTML when modal opens
  useEffect(() => {
    if (isFormModalOpen && editorRef.current) {
      editorRef.current.innerHTML = editingPlan ? editingPlan.content : '';
    }
  }, [isFormModalOpen, editingPlan]);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('/api/student/plans');
      setPlans(data);
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    const todayStr = getLocalDateString();
    setEditingPlan(null);
    setForm({
      title: '',
      category: 'today',
      startDate: todayStr,
      targetDate: todayStr,
      content: '',
      plainTextContent: '',
      status: 'pending'
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (plan: any) => {
    setEditingPlan(plan);
    setForm({
      title: plan.title,
      category: plan.category,
      startDate: getLocalDateString(new Date(plan.startDate)),
      targetDate: getLocalDateString(new Date(plan.targetDate)),
      content: plan.content,
      plainTextContent: plan.plainTextContent,
      status: plan.status
    });
    setIsFormModalOpen(true);
  };

  // Editor styling helpers using execCommand
  const execEditorCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setForm(prev => ({
        ...prev,
        content: editorRef.current?.innerHTML || '',
        plainTextContent: editorRef.current?.innerText || ''
      }));
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setForm(prev => ({
        ...prev,
        content: editorRef.current?.innerHTML || '',
        plainTextContent: editorRef.current?.innerText || ''
      }));
    }
  };

  const handleResetEditor = () => {
    if (editorRef.current) {
      const originalContent = editingPlan ? editingPlan.content : '';
      const originalPlainText = editingPlan ? editingPlan.plainTextContent : '';
      editorRef.current.innerHTML = originalContent;
      setForm(prev => ({
        ...prev,
        content: originalContent,
        plainTextContent: originalPlainText
      }));
      toast.success('Editor reset to original content');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter a plan title');
      return;
    }
    if (!form.content.trim()) {
      toast.error('Please enter plan description notes');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPlan) {
        await axios.put(`/api/student/plans/${editingPlan._id}`, form);
        toast.success('Plan updated successfully!');
      } else {
        await axios.post('/api/student/plans', form);
        toast.success('New plan added!');
      }
      setIsFormModalOpen(false);
      fetchPlans();
    } catch (error) {
      toast.error('Failed to save plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Delete Study Plan',
      message: 'Are you sure you want to permanently delete this plan?',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/student/plans/${id}`);
          toast.success('Plan deleted successfully');
          fetchPlans();
        } catch (error) {
          toast.error('Failed to delete plan');
        }
      }
    });
  };

  // Share and Download Utilities
  const handleShareLink = async (plan: any) => {
    try {
      const { data } = await axios.post(`/api/student/plans/${plan._id}/share-link`);
      const fullUrl = window.location.origin + data.shareUrl;
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Public PDF share link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to generate sharing link');
    }
  };

  const handleShareAsText = async (plan: any) => {
    const shareText = `📚 *STUDENT PLAN TARGET* 📚\n\n*Title:* ${plan.title}\n*Category:* ${categoryMap[plan.category] || plan.category}\n*Timeline:* ${new Date(plan.startDate).toLocaleDateString()} - ${new Date(plan.targetDate).toLocaleDateString()}\n*Status:* ${statusLabels[plan.status]}\n\n*Details:*\n${plan.plainTextContent}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: plan.title,
          text: shareText
        });
      } catch (err) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        toast.success('Copied plan details to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Copied plan details to clipboard!');
    }
  };

  const downloadAllPdf = async () => {
    const loadingToast = toast.loading('Generating and downloading PDF...');
    try {
      const response = await axios.get('/api/student/plans/pdf/all', {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'All_Student_Plans.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully!', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to download PDF', { id: loadingToast });
    }
  };

  // Filtering plans logic
  const filteredPlans = plans.filter(p => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'completed' || activeFilter === 'pending') {
      return p.status === activeFilter;
    }
    return p.category === activeFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Student Todo / Plan Notes</span>
            <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Draft goals, assign target timelines, and track your achievements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={downloadAllPdf}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-3 rounded-2xl transition-all font-bold active:scale-95 text-xs hover:border-indigo-500"
          >
            <FileDown className="w-4 h-4 text-indigo-500" />
            <span>PDF: All Plans</span>
          </button>
          

          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl transition-all shadow-lg font-bold active:scale-95 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Block */}
      <div className="flex overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide space-x-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              "px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border",
              activeFilter === tab.id 
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none" 
                : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-indigo-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plans List Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      ) : filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <motion.div
              key={plan._id}
              layout
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('select') || target.closest('button')) {
                  return;
                }
                setViewingPlan(plan);
                setIsViewModalOpen(true);
              }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 relative group overflow-hidden cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={cn(
                    "px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-wider",
                    categoryBadgeStyles[plan.category] || 'bg-gray-50 text-gray-600 border-gray-100'
                  )}>
                    {categoryMap[plan.category] || plan.category}
                  </span>
                  
                  <select
                    value={plan.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={async (e) => {
                      e.stopPropagation();
                      const newStatus = e.target.value;
                      try {
                        await axios.put(`/api/student/plans/${plan._id}`, { status: newStatus });
                        toast.success('Status updated!');
                        fetchPlans();
                      } catch (err) {
                        toast.error('Failed to update status');
                      }
                    }}
                    className={cn(
                      "px-3 py-1 border rounded-xl text-xs font-black uppercase cursor-pointer outline-none transition-colors",
                      plan.status === 'pending' && "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-850/55 dark:text-amber-300",
                      plan.status === 'in_progress' && "bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950/40 dark:border-blue-850/55 dark:text-blue-300",
                      plan.status === 'completed' && "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-850/55 dark:text-emerald-300"
                    )}
                  >
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold" value="pending">Pending</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold" value="in_progress">In Progress</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold" value="completed">Completed</option>
                  </select>
                </div>

                <h3 className="text-lg font-black text-gray-900 dark:text-white line-clamp-1 mb-2">
                  {plan.title}
                </h3>
                
                {/* Timeline Row & Remaining Time */}
                <div className="flex flex-col text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase mb-2 tracking-wider gap-0.5">
                  <div className="flex items-center space-x-2">
                    <span>Start: {new Date(plan.startDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Target: {new Date(plan.targetDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-1">
                    Remaining: {getRemainingTimeText(plan.targetDate, plan.status)}
                  </div>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="border-t border-gray-50 dark:border-gray-700/60 pt-4 mt-4 flex items-center justify-between gap-1.5">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(plan);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl transition-colors"
                    title="Edit Plan"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(plan._id);
                    }}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-xl transition-colors"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareLink(plan);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl transition-colors"
                    title="Copy Share Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareAsText(plan);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl transition-colors"
                    title="Share as text"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Planner Found</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xs mx-auto mb-6">
            You have not created any plan yet. Create your first study plan.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all font-bold active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        </div>
      )}

      {/* Form Modal (Create & Edit) */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsFormModalOpen(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  {editingPlan ? 'Edit Study Plan' : 'Create Study Plan'}
                </h2>
                <button onClick={() => setIsFormModalOpen(false)}>
                  <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Title */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Plan Title</label>
                  <input
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                    placeholder="e.g. Mathematics Mid-Term Revision"
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                  />
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Plan Category</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                      value={form.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                    >
                      <option value="today">Today Plan</option>
                      <option value="seven_days">7 Days Plan</option>
                      <option value="one_month">1 Month Plan</option>
                      <option value="six_months">6 Months Plan</option>
                      <option value="one_year">1 Year Plan</option>
                      <option value="custom">Custom Plan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                      value={form.status}
                      onChange={(e) => setForm({...form, status: e.target.value})}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Timelines */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
                    <input
                      type="date"
                      required
                      disabled={form.category !== 'custom'}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      value={form.startDate}
                      onChange={(e) => setForm({...form, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Target Date / Deadline</label>
                    <input
                      type="date"
                      required
                      disabled={form.category !== 'custom'}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      value={form.targetDate}
                      onChange={(e) => setForm({...form, targetDate: e.target.value})}
                    />
                  </div>
                </div>

                {/* Duration Preview Panel */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between border border-indigo-100/30">
                  <span>Time Remaining:</span>
                  <span className="uppercase tracking-wider font-extrabold text-[11px]">{getRemainingTimeText(form.targetDate, form.status)}</span>
                </div>

                {/* Rich Text Editor Tool */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Plan Description / Notes (Rich Text)
                  </label>
                  
                  {/* Editor Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-900 border border-b-0 border-gray-100 dark:border-gray-700 rounded-t-xl select-none">
                    <button
                      type="button"
                      onClick={() => execEditorCommand('bold')}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300"
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execEditorCommand('italic')}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300"
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execEditorCommand('underline')}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300"
                      title="Underline"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    
                    <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

                    {/* Font Size */}
                    <button
                      type="button"
                      onClick={() => execEditorCommand('fontSize', '4')}
                      className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-800 rounded font-black text-gray-700 dark:text-gray-300"
                      title="Increase Font Size"
                    >
                      A+
                    </button>
                    <button
                      type="button"
                      onClick={() => execEditorCommand('fontSize', '2')}
                      className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-800 rounded font-black text-gray-700 dark:text-gray-300"
                      title="Decrease Font Size"
                    >
                      A-
                    </button>

                    <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

                    {/* Lists */}
                    <button
                      type="button"
                      onClick={() => execEditorCommand('insertUnorderedList')}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300"
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execEditorCommand('insertOrderedList')}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300"
                      title="Ordered List"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>

                    <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

                    {/* Colors */}
                    <button
                      type="button"
                      onClick={() => execEditorCommand('foreColor', 'black')}
                      className="w-5 h-5 rounded bg-black border border-gray-300"
                      title="Black"
                    />
                    <button
                      type="button"
                      onClick={() => execEditorCommand('foreColor', 'red')}
                      className="w-5 h-5 rounded bg-red-600"
                      title="Red"
                    />
                    <button
                      type="button"
                      onClick={() => execEditorCommand('foreColor', 'green')}
                      className="w-5 h-5 rounded bg-emerald-600"
                      title="Green"
                    />
                    <button
                      type="button"
                      onClick={() => execEditorCommand('foreColor', 'yellow')}
                      className="w-5 h-5 rounded bg-amber-400"
                      title="Yellow"
                    />

                    <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

                    <button
                      type="button"
                      onClick={handleResetEditor}
                      className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-800 rounded font-black text-indigo-600 dark:text-indigo-400"
                      title="Reset Content"
                    >
                      Reset
                    </button>
                  </div>

                  {/* contentEditable Area */}
                  <div
                    key={editingPlan ? editingPlan._id : 'new-plan'}
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="Start writing your plan notes here..."
                    className="w-full min-h-[180px] p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium overflow-y-auto text-gray-900 dark:text-white relative before:content-[attr(data-placeholder)] before:text-gray-400 dark:before:text-gray-500 before:absolute before:top-4 before:left-4 before:pointer-events-none empty:before:block before:hidden"
                    onInput={handleEditorInput}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="flex-1 px-6 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold active:scale-95 transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] bg-indigo-600 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 text-xs"
                  >
                    {isSubmitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Save Plan'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal (Read-Only) */}
      <AnimatePresence>
        {isViewModalOpen && viewingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsViewModalOpen(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={cn(
                    "px-3 py-1 border rounded-full text-[9px] font-black uppercase tracking-wider",
                    categoryBadgeStyles[viewingPlan.category] || 'bg-gray-50 text-gray-600 border-gray-100'
                  )}>
                    {categoryMap[viewingPlan.category]}
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-3">
                    {viewingPlan.title}
                  </h2>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Meta Panels */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl mb-6">
                <div>
                  <span className="block text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Start Date</span>
                  <span className="text-xs font-black text-gray-700 dark:text-gray-300">{new Date(viewingPlan.startDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Deadline</span>
                  <span className="text-xs font-black text-gray-700 dark:text-gray-300">{new Date(viewingPlan.targetDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Remaining</span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{getRemainingTimeText(viewingPlan.targetDate, viewingPlan.status)}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</span>
                  <span className={cn(
                    "inline-block px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase mt-0.5",
                    statusStyles[viewingPlan.status] || 'bg-gray-50 text-gray-600 border-gray-100'
                  )}>
                    {statusLabels[viewingPlan.status]}
                  </span>
                </div>
              </div>

              {/* Formatted HTML Notes */}
              <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl min-h-[150px] mb-6">
                <div 
                  className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: viewingPlan.content }} 
                />
              </div>

              {/* Action row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-50 dark:border-gray-700/60 pt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenEditModal(viewingPlan);
                    }}
                    className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleShareLink(viewingPlan)}
                    className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500"
                    title="Copy Shareable Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleShareAsText(viewingPlan)}
                    className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500"
                    title="Share as Plain Text"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
