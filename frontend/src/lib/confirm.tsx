import React from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'motion/react';
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
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  const root = createRoot(container);

  const handleClose = () => {
    root.unmount();
    container.remove();
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  root.render(
    <div 
      className="fixed inset-0 z-[99999] w-screen h-screen flex items-center justify-center p-4 sm:p-6 bg-transparent select-none" 
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.4)] max-w-sm w-full overflow-hidden border border-gray-100 dark:border-gray-800 relative mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 sm:p-10">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 rounded-3xl rotate-12" />
            <div className="absolute inset-0 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-3xl -rotate-6">
              <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <h3 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-2 tracking-tight">
            {title}
          </h3>
          
          <p className="text-center text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-semibold text-sm">
            {message}
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleConfirm}
              className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-650/20 text-base cursor-pointer"
            >
              {confirmText}
            </button>
            <button
              onClick={handleClose}
              className="w-full py-3.5 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 font-bold rounded-2xl transition-all active:scale-[0.98] text-base cursor-pointer"
            >
              {cancelText}
            </button>
          </div>
        </div>
        
        <button 
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-905 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};
