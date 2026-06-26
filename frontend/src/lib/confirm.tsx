import React from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const showConfirm = ({
  title = 'Are you sure?',
  message,
  onConfirm,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger'
}: ConfirmProps) => {
  toast.custom(
    (t) => (
      <AnimatePresence>
        {t.visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
            style={{ 
              position: 'fixed',
              left: 0,
              top: 0,
              width: '100vw',
              height: '100vh'
            }}
            onClick={() => toast.dismiss(t.id)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] max-w-sm w-full overflow-hidden border border-white/20 dark:border-gray-800 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-10">
                <div className="relative w-20 h-20 mx-auto mb-8">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 rounded-3xl rotate-12" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-3xl -rotate-6 transition-transform hover:rotate-0">
                    <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-center text-gray-900 dark:text-white mb-3 tracking-tighter">
                  {title}
                </h3>
                
                <p className="text-center text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-medium">
                  {message}
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      onConfirm();
                      toast.dismiss(t.id);
                    }}
                    className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-600/30 text-lg"
                  >
                    {confirmText}
                  </button>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full py-4 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200 font-bold rounded-2xl transition-all active:scale-[0.98]"
                  >
                    {cancelText}
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => toast.dismiss(t.id)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    ),
    { duration: Infinity, position: 'top-center' }
  );
};
