import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Briefcase, Plus, X, ChevronRight, FileText, Link as LinkIcon, 
  Image as ImageIcon, Download, Trash2, ArrowLeft, Loader2, Info, Share2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { showConfirm } from '../lib/confirm';
import { Skeleton } from '../components/ui/Skeleton';
import { jsPDF } from 'jspdf';

const branchDisplayNames: Record<string, string> = {
  ALL: 'All Branches',
  BTECH: 'B.Tech',
  MBA: 'MBA',
  MTECH: 'M.Tech',
  BBA: 'BBA',
  BCA: 'BCA',
  MCA: 'MCA',
  BCOM: 'B.Com',
  DIPLOMA: 'Diploma'
};

const CareerGuidancePage = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [guides, setGuides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { categoryId, guideId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!categories.length) return;

    if (categoryId) {
      const foundCategory = categories.find(cat => cat._id === categoryId);
      if (foundCategory) {
        setSelectedCategory(foundCategory);
      } else {
        setSelectedCategory(null);
        setSelectedGuide(null);
        navigate('/career', { replace: true });
      }
    } else {
      setSelectedCategory(null);
      setSelectedGuide(null);
    }
  }, [categoryId, categories, navigate]);

  useEffect(() => {
    if (!selectedCategory) {
      setSelectedGuide(null);
      return;
    }

    if (isLoading) return;

    if (guides.length > 0 && guides[0].category !== selectedCategory._id) {
      return;
    }

    if (guideId) {
      const foundGuide = guides.find(g => g._id === guideId);
      if (foundGuide) {
        setSelectedGuide(foundGuide);
      } else {
        setSelectedGuide(null);
        navigate(`/career/category/${selectedCategory._id}`, { replace: true });
      }
    } else {
      setSelectedGuide(null);
    }
  }, [guideId, selectedCategory, guides, isLoading, navigate]);

  const [activeBranch, setActiveBranch] = useState<string>('ALL');

  useEffect(() => {
    if (user) {
      if (user.role === 'STUDENT' && user.branch) {
        setActiveBranch(user.branch);
      } else if (user.role === 'TEACHER' && user.authorizedBranches?.length) {
        setActiveBranch(user.authorizedBranches[0]);
      } else {
        setActiveBranch('ALL');
      }
    }
  }, [user]);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    branch: 'ALL'
  });

  useEffect(() => {
    if (user) {
      if (user.role === 'TEACHER' && user.authorizedBranches?.length) {
        setCategoryForm(prev => ({ ...prev, branch: user.authorizedBranches[0] }));
      } else if (user.role === 'STUDENT' && user.branch) {
        setCategoryForm(prev => ({ ...prev, branch: user.branch }));
      } else {
        setCategoryForm(prev => ({ ...prev, branch: 'ALL' }));
      }
    }
  }, [user]);

  // Guide Form State
  const [guideForm, setGuideForm] = useState({
    title: '',
    content: '',
    attachment: '' as string,
    links: [{ title: '', url: '' }]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchGuides(selectedCategory._id);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('/api/career/categories');
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load career categories');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGuides = async (catId: string) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`/api/career/guides/${catId}`);
      setGuides(data);
    } catch (error) {
      toast.error('Failed to load guides');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/api/career/categories', categoryForm);
      toast.success('Category created!');
      setIsCategoryModalOpen(false);
      let defaultBranch = 'ALL';
      if (user?.role === 'TEACHER' && user.authorizedBranches?.length) {
        defaultBranch = user.authorizedBranches[0];
      } else if (user?.role === 'STUDENT' && user.branch) {
        defaultBranch = user.branch;
      }
      setCategoryForm({ name: '', description: '', branch: defaultBranch });
      fetchCategories();
    } catch (error) {
      toast.error('Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File exceeds 5MB limit');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setGuideForm({ ...guideForm, attachment: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    
    setIsSubmitting(true);
    try {
      const validLinks = guideForm.links.filter(l => l.title && l.url);
      await axios.post('/api/career/guides', {
        ...guideForm,
        categoryId: selectedCategory._id,
        links: JSON.stringify(validLinks)
      });
      toast.success('Guide added!');
      setIsGuideModalOpen(false);
      setGuideForm({ title: '', content: '', attachment: '', links: [{ title: '', url: '' }] });
      fetchGuides(selectedCategory._id);
    } catch (error) {
      toast.error('Failed to add guide');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Delete Category',
      message: 'This will remove all guides inside this category. Continue?',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/career/categories/${id}`);
          toast.success('Deleted');
          fetchCategories();
        } catch (error) {
          toast.error('Action failed');
        }
      }
    });
  };

  const downloadAsPDF = () => {
    if (!selectedGuide) return;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const margin = 20;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const maxLineWidth = pageWidth - (margin * 2);

      // Title
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      const titleLines = doc.splitTextToSize(selectedGuide.title, maxLineWidth);
      let y = margin + 10;
      titleLines.forEach((line: string) => {
        doc.text(line, margin, y);
        y += 10;
      });

      // Decorative divider line
      doc.setDrawColor(99, 102, 241); // indigo-600 color (#6366F1)
      doc.setLineWidth(0.8);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;

      // Meta: Category & Branch
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // gray-500 (#64748B)
      doc.text(`Category: ${selectedCategory?.name || 'Career Guidance'}`, margin, y);
      y += 6;
      doc.text(`Target Branch: ${selectedCategory?.branch || 'ALL'}`, margin, y);
      y += 12;

      // Body content
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59); // dark slate (#1E293B)

      const contentLines: string[] = doc.splitTextToSize(selectedGuide.content || '', maxLineWidth);
      const lineHeight = 6.5;

      contentLines.forEach((line: string) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin + 10;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      // Add Attachments/Links if present
      const attachmentsList = selectedGuide.attachments || [];
      const linksList = selectedGuide.links || [];
      
      if (attachmentsList.length > 0 || linksList.length > 0) {
        if (y + 20 > pageHeight - margin) {
          doc.addPage();
          y = margin + 10;
        }
        
        y += 10;
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(99, 102, 241); // indigo-600
        doc.text('RESOURCES & LINKS:', margin, y);
        y += 8;
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // slate-600
        
        attachmentsList.forEach((att: any) => {
          if (y + 6 > pageHeight - margin) {
            doc.addPage();
            y = margin + 10;
          }
          doc.text(`• File [${att.type.toUpperCase()}]: ${att.url}`, margin + 4, y);
          y += 6;
        });
        
        linksList.forEach((link: any) => {
          if (y + 6 > pageHeight - margin) {
            doc.addPage();
            y = margin + 10;
          }
          doc.text(`• ${link.title}: ${link.url}`, margin + 4, y);
          y += 6;
        });
      }

      const fileName = `${selectedGuide.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_guide.pdf`;
      doc.save(fileName);
      toast.success('Successfully downloaded PDF!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF');
    }
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const isAuthorized = user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN' || (user?.role as string) === 'ADMIN';

  const allowedBranches = React.useMemo(() => {
    if (user?.role === 'SUPER_ADMIN' || (user?.role as string) === 'ADMIN') {
      return ['ALL', 'BTECH', 'MBA', 'MTECH', 'BBA', 'BCA', 'MCA', 'BCOM', 'DIPLOMA'];
    }
    if (user?.role === 'TEACHER') {
      return user.authorizedBranches || [];
    }
    if (user?.role === 'STUDENT') {
      return user.branch ? [user.branch] : [];
    }
    return [];
  }, [user]);

  const filteredCategories = categories.filter(cat => {
    // Non-admin roles can only view categories matching their allowed branches
    if (user?.role !== 'SUPER_ADMIN' && (user?.role as string) !== 'ADMIN') {
      if (!allowedBranches.includes(cat.branch)) {
        return false;
      }
    }
    if (activeBranch === 'ALL') return true;
    return cat.branch === activeBranch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          {(selectedCategory || selectedGuide) && (
            <button 
              onClick={() => {
                if (selectedGuide) {
                  navigate(`/career/category/${selectedCategory._id}`);
                } else {
                  navigate('/career');
                }
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {selectedGuide ? selectedGuide.title : selectedCategory ? selectedCategory.name : 'Career Guidance'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">
              {selectedGuide ? 'Detailed Roadmap' : selectedCategory ? selectedCategory.description : 'Expert advice for your professional growth'}
            </p>
          </div>
        </div>
        {isAuthorized && !selectedCategory && (
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl transition-all shadow-lg font-bold active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        )}
        {isAuthorized && selectedCategory && !selectedGuide && (
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl transition-all shadow-lg font-bold active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Folder</span>
          </button>
        )}
      </div>

      {!selectedCategory && allowedBranches.length > 1 && (
        <div className="flex overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide space-x-2">
          {allowedBranches.map((b) => (
            <button
              key={b}
              onClick={() => setActiveBranch(b)}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                activeBranch === b 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none" 
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-indigo-200"
              )}
            >
              {b}
            </button>
          ))}
        </div>
      )}

      {!selectedCategory ? (
        /* Categories Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-3xl" />
            ))
          ) : filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <motion.div
                key={cat._id}
                layout
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/career/category/${cat._id}`)}
                className="group relative bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Briefcase className="w-7 h-7" />
                  </div>
                  <div className="px-3 py-1 bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {cat.branch}
                  </div>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{cat.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 font-medium leading-relaxed">{cat.description}</p>
                
                <div className="mt-8 flex items-center text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest">
                  <span>Explore Guides</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>

                {isAuthorized && (
                  <button
                    onClick={(e) => handleDeleteCategory(cat._id, e)}
                    className="absolute top-6 right-6 p-2 text-red-100 group-hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 bg-gray-50 dark:bg-gray-800/30 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-700 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">No career categories available.</p>
            </div>
          )}
        </div>
      ) : selectedGuide ? (
        /* Guide Detail View */
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm"
        >
           <div className="max-w-4xl mx-auto space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-6">
                <div>
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Career Guide
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-2">{selectedGuide.title}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                     onClick={handleShare}
                     className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-5 py-3.5 rounded-2xl transition-all font-bold active:scale-95 text-xs sm:text-sm"
                  >
                     <Share2 className="w-4 h-4" />
                     <span>Share</span>
                  </button>
                  <button 
                     onClick={downloadAsPDF}
                     className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3.5 rounded-2xl transition-all shadow-md font-bold active:scale-95 text-xs sm:text-sm"
                  >
                     <Download className="w-4 h-4" />
                     <span>Download as PDF</span>
                  </button>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                 <p className="text-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-medium leading-relaxed">
                    {selectedGuide.content}
                 </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {/* Attachments Section */}
                 {selectedGuide.attachments?.length > 0 && (
                   <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Documents & Media</h4>
                      <div className="space-y-3">
                        {selectedGuide.attachments.map((att: any, idx: number) => (
                           <a
                             key={idx}
                             href={att.url}
                             target="_blank"
                             rel="noreferrer"
                             className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                           >
                             <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                               {att.type === 'pdf' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" /> }
                             </div>
                             <div className="flex-1 overflow-hidden">
                               <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Open File</p>
                               <p className="text-[10px] text-gray-500 uppercase font-black">{att.type}</p>
                             </div>
                             <Download className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                           </a>
                        ))}
                      </div>
                   </div>
                 )}

                 {/* Links Section */}
                 {selectedGuide.links?.length > 0 && (
                   <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Useful Web Resource</h4>
                      <div className="space-y-3">
                        {selectedGuide.links.map((link: any, idx: number) => (
                           <a
                             key={idx}
                             href={link.url}
                             target="_blank"
                             rel="noreferrer"
                             className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                           >
                             <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                               <LinkIcon className="w-5 h-5" />
                             </div>
                             <div className="flex-1 overflow-hidden">
                               <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{link.title}</p>
                               <p className="text-[10px] text-gray-500 truncate">{link.url}</p>
                             </div>
                           </a>
                        ))}
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </motion.div>
      ) : (
        /* Guides (Folders) List */
        <div className="flex flex-col space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))
          ) : guides.length > 0 ? (
            guides.map((guide) => (
              <motion.div
                key={guide._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate(`/career/category/${selectedCategory._id}/guide/${guide._id}`)}
                className="group flex items-center justify-between bg-white dark:bg-gray-800 p-5 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-200 transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{guide.title}</h3>
                </div>
                <div className="flex items-center space-x-4">
                   {isAuthorized && (
                    <button 
                       className="p-2 text-gray-300 hover:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                       onClick={(e) => {
                        e.stopPropagation();
                        showConfirm({
                          title: 'Delete Folder',
                          message: 'Delete this folder permanently?',
                          onConfirm: async () => {
                            try {
                              await axios.delete(`/api/career/guides/${guide._id}`);
                              fetchGuides(selectedCategory._id);
                              toast.success('Deleted');
                            } catch(e) {}
                          }
                        })
                       }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 bg-gray-50 dark:bg-gray-800/30 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-700 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">No folders found in this category.</p>
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCategoryModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">New Category</h2>
                <button onClick={() => setIsCategoryModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleCreateCategory} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Branch</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                    value={categoryForm.branch}
                    onChange={(e) => setCategoryForm({...categoryForm, branch: e.target.value})}
                  >
                    {allowedBranches.map((b) => (
                      <option key={b} value={b}>
                        {branchDisplayNames[b] || b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Category Name</label>
                  <input
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Placement Prep, Gate Exam"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                    placeholder="What is this category about?"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Category'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guide Modal */}
      <AnimatePresence>
        {isGuideModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Add Career Folder</h2>
                <button onClick={() => setIsGuideModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleCreateGuide} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Folder Name</label>
                  <input
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold"
                    placeholder="e.g. Python Interview Questions"
                    value={guideForm.title}
                    onChange={(e) => setGuideForm({...guideForm, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Detailed Content (Copy Paste Text)</label>
                  <textarea
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium"
                    placeholder="Paste important guide content here..."
                    value={guideForm.content}
                    onChange={(e) => setGuideForm({...guideForm, content: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Attachment (Image/PDF)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all",
                        guideForm.attachment ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" : "border-gray-200 dark:border-gray-700"
                      )}
                    >
                      {guideForm.attachment ? (
                        <div className="text-center p-4">
                          <FileText className="w-6 h-6 text-indigo-600 mx-auto" />
                          <p className="text-[10px] font-bold mt-2 truncate max-w-[150px]">File Selected</p>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                          <p className="text-[10px] font-bold text-gray-400 mt-2">Upload File</p>
                        </>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="application/pdf,image/*" />
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Helpful Links</label>
                     <div className="space-y-2">
                        {guideForm.links.map((link, idx) => (
                           <div key={idx} className="flex gap-2">
                             <input 
                               placeholder="Label" 
                               className="w-1/3 px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-[10px] font-bold border border-gray-100 dark:border-gray-700" 
                               value={link.title}
                               onChange={(e) => {
                                 const newLinks = [...guideForm.links];
                                 newLinks[idx].title = e.target.value;
                                 setGuideForm({...guideForm, links: newLinks});
                               }}
                             />
                             <input 
                               placeholder="URL (http...)" 
                               className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-[10px] font-medium border border-gray-100 dark:border-gray-700" 
                               value={link.url}
                               onChange={(e) => {
                                 const newLinks = [...guideForm.links];
                                 newLinks[idx].url = e.target.value;
                                 setGuideForm({...guideForm, links: newLinks});
                               }}
                             />
                           </div>
                        ))}
                        <button 
                          type="button" 
                          onClick={() => setGuideForm({...guideForm, links: [...guideForm.links, { title: '', url: '' }]})}
                          className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1"
                        >+ Add More Links</button>
                     </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsGuideModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 font-bold"
                  >Cancel</button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Post Folder'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CareerGuidancePage;
