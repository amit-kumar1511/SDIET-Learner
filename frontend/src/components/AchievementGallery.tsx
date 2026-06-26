import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Image as ImageIcon, ChevronRight, X } from 'lucide-react';
import { Skeleton } from './ui/Skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

const GalleryPreview = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('/api/achievements');
      // Only keep the first 6
      setAchievements(data.achievements.slice(0, 6));
    } catch (error) {
      console.error('Failed to load gallery preview');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center">
            <ImageIcon className="w-5 h-5 mr-3 text-indigo-600" />
            Achievement Gallery
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Recent highlights from our institution</p>
        </div>
        <Link 
          to="/gallery" 
          className="flex items-center space-x-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <span>View All</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-900/30 rounded-[5px] overflow-hidden animate-pulse">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-full rounded-[2px]" />
                <Skeleton className="h-3 w-2/3 rounded-[2px]" />
              </div>
            </div>
          ))
        ) : achievements.length > 0 ? (
          achievements.map((achievement) => (
            <motion.div
              key={achievement._id}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-gray-800 rounded-[5px] overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
              onClick={() => setSelectedImage(achievement.imageUrl)}
            >
              <div className="aspect-square overflow-hidden bg-gray-200 dark:bg-gray-800">
                <img 
                  src={achievement.imageUrl} 
                  alt={achievement.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  loading="lazy"
                />
              </div>
              <div className="p-2 bg-white dark:bg-gray-800 flex-1 border-t border-gray-50 dark:border-gray-700">
                <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 line-clamp-2 leading-tight h-7">
                  {achievement.title}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-400">No achievements shared yet.</p>
          </div>
        )}
      </div>

      {/* Mini Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full"
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white"
              >
                <X className="w-8 h-8" />
              </button>
              <img 
                src={selectedImage} 
                alt="Full" 
                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" 
                onClick={() => setSelectedImage(null)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPreview;
