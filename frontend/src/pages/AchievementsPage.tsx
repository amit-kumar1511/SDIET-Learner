import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Plus, X, Trash2, Maximize2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { showConfirm } from '../lib/confirm';
import { Skeleton } from '../components/ui/Skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const AchievementsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    image: '' as string,
    fileSize: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('/api/achievements');
      setAchievements(data.achievements);
      setCount(data.count);
    } catch (error) {
      toast.error('Failed to load gallery');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeInMB = file.size / (1024 * 1024);
      if (file.size > 6 * 1024 * 1024) {
        toast.error(`Image size (${sizeInMB.toFixed(2)}MB) exceeds 6MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ 
          ...formData, 
          image: reader.result as string,
          fileSize: file.size
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.image) {
      toast.error('Please provide both title and image');
      return;
    }

    setIsUploading(true);
    try {
      await axios.post('/api/achievements', {
        title: formData.title,
        image: formData.image
      });
      toast.success('Achievement uploaded!');
      setFormData({ title: '', image: '', fileSize: 0 });
      setIsModalOpen(false);
      fetchAchievements();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm({
      title: 'Delete Image',
      message: 'Are you sure you want to delete this achievement from the gallery?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/achievements/${id}`);
          fetchAchievements();
        } catch (error) {
          toast.error('Delete failed');
        }
      }
    });
  };

  const isAuthorized = user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN' || (user?.role as string) === 'ADMIN';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Achievement Gallery
              </h1>
              <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold ring-1 ring-indigo-100 dark:ring-indigo-800">
                {count}/300
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Capturing excellence & highlights</p>
          </div>
        </div>
        {isAuthorized && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-100 dark:shadow-none font-bold active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Upload New</span>
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
        {isLoading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-[5px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-full rounded-[2px]" />
                <Skeleton className="h-4 w-2/3 rounded-[2px]" />
              </div>
            </div>
          ))
        ) : achievements.length > 0 ? (
          achievements.map((achievement) => (
            <motion.div
              key={achievement._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white dark:bg-gray-800 rounded-[5px] overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col"
              onClick={() => setSelectedImage(achievement.imageUrl)}
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
                <img 
                  src={achievement.imageUrl} 
                  alt={achievement.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                
                {isAuthorized && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(achievement._id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all active:scale-95 z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100" />
                </div>
              </div>
              
              <div className="p-3 flex-1">
                <p className="text-[10px] sm:text-[11px] font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed h-[2rem]">
                  {achievement.title}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] flex items-center justify-center mb-4">
              <ImageIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Gallery is Empty</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto font-medium">Be the first to share an achievement.</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUploading && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Add Achievement</h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isUploading}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Achievement Details</label>
                  <textarea
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
                    placeholder="Describe the occasion or achievement..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Photo</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "group relative w-full aspect-video rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900/100",
                      formData.image ? "border-indigo-500" : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    {formData.image ? (
                      <div className="relative w-full h-full">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-[10px] font-bold">
                          {(formData.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                        <p className="text-gray-900 dark:text-white font-bold">Choose Image</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 6MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl mb-4">
                  <AlertCircle className="w-5 h-5 text-indigo-600" />
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
                    Once uploaded, this will be visible to everyone on the campus portal.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-indigo-600 text-white font-black py-4 px-8 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Upload to Gallery</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoom / Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full"
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-indigo-400 transition-colors"
              >
                <X className="w-10 h-10" />
              </button>
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10 flex items-center justify-center bg-black">
                <img 
                  src={selectedImage} 
                  alt="Achievement Full" 
                  className="w-full h-auto max-h-[85vh] object-contain cursor-zoom-out" 
                  onClick={() => setSelectedImage(null)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AchievementsPage;
