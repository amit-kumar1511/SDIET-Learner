import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, X, Trash2, Edit2, Share2, Copy, FileText, Sparkles, FileDown
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Modals state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<any>(null);

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
    navigate('/student-plans/create-plan');
  };

  const handleOpenEditModal = (plan: any) => {
    navigate(`/student-plans/create-plan?edit=${plan._id}`);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Delete Study Plan',
      message: 'Are you sure you want to permanently delete this plan?',
      onConfirm: async () => {
        const loadingToast = toast.loading('Deleting plan...');
        try {
          await axios.delete(`/api/student/plans/${id}`);
          toast.success('Plan deleted successfully', { id: loadingToast });
          fetchPlans();
        } catch (error) {
          toast.error('Failed to delete plan', { id: loadingToast });
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
