import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Bold, Italic, Underline, List, ListOrdered, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';

const getLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export default function CreatePlanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [form, setForm] = useState({
    title: '',
    category: 'today',
    startDate: getLocalDateString(),
    targetDate: getLocalDateString(),
    content: '',
    plainTextContent: '',
    status: 'pending'
  });

  const [originalContent, setOriginalContent] = useState('');
  const [originalPlainText, setOriginalPlainText] = useState('');

  // Fetch plan details if editing
  useEffect(() => {
    if (editId) {
      fetchPlanDetails(editId);
    }
  }, [editId]);

  const fetchPlanDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`/api/student/plans/${id}`);
      setForm({
        title: data.title,
        category: data.category,
        startDate: getLocalDateString(new Date(data.startDate)),
        targetDate: getLocalDateString(new Date(data.targetDate)),
        content: data.content,
        plainTextContent: data.plainTextContent,
        status: data.status
      });
      setOriginalContent(data.content);
      setOriginalPlainText(data.plainTextContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = data.content;
      }
    } catch (error) {
      toast.error('Failed to load plan details');
      navigate('/student-plans');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync editor HTML for new plan loads/renders
  useEffect(() => {
    if (!isLoading && editorRef.current && !editId) {
      editorRef.current.innerHTML = '';
    }
  }, [isLoading, editId]);

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
      if (editId) {
        await axios.put(`/api/student/plans/${editId}`, form);
        toast.success('Plan updated successfully!');
      } else {
        await axios.post('/api/student/plans', form);
        toast.success('New plan added!');
      }
      navigate('/student-plans');
    } catch (error) {
      toast.error('Failed to save plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header with Back Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => navigate('/student-plans')}
            className="p-2.5 bg-gray-55 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-850 rounded-xl transition-all active:scale-95 text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{editId ? 'Edit Study Plan' : 'Create Study Plan'}</span>
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Fill in details to set targets and track your academic progress
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          
          {/* Plan Title */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
              Plan Title
            </label>
            <input
              required
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all"
              placeholder="e.g. Mathematics Mid-Term Revision"
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                Plan Category
              </label>
              <select
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all"
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
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                Status
              </label>
              <select
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all"
                value={form.status}
                onChange={(e) => setForm({...form, status: e.target.value})}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Start Date & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                Start Date
              </label>
              <input
                type="date"
                required
                disabled={form.category !== 'custom'}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed outline-none transition-all"
                value={form.startDate}
                onChange={(e) => setForm({...form, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                Target Date / Deadline
              </label>
              <input
                type="date"
                required
                disabled={form.category !== 'custom'}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed outline-none transition-all"
                value={form.targetDate}
                onChange={(e) => setForm({...form, targetDate: e.target.value})}
              />
            </div>
          </div>

          {/* Time Remaining Indicator */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 p-4 rounded-xl text-xs font-bold flex items-center justify-between border border-indigo-100/30">
            <span>Time Remaining:</span>
            <span className="uppercase tracking-wider font-extrabold text-[11px]">
              {getRemainingTimeText(form.targetDate, form.status)}
            </span>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
              Plan Description / Notes (Rich Text)
            </label>
            
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-900 border border-b-0 border-gray-200 dark:border-gray-750 rounded-t-xl select-none">
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

              {editId && (
                <>
                  <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
                  <button
                    type="button"
                    onClick={handleResetEditor}
                    className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-800 rounded font-black text-indigo-600 dark:text-indigo-400"
                    title="Reset Content"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>

            {/* Editable Content Area */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Start writing your plan notes here..."
              className="w-full min-h-[220px] p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium overflow-y-auto text-gray-900 dark:text-white relative before:content-[attr(data-placeholder)] before:text-gray-400 dark:before:text-gray-500 before:absolute before:top-4 before:left-4 before:pointer-events-none empty:before:block before:hidden"
              onInput={handleEditorInput}
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/student-plans')}
              className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold active:scale-95 transition-all text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 text-xs"
            >
              {isSubmitting ? 'Saving Plan...' : editId ? 'Update Plan' : 'Save Plan'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
