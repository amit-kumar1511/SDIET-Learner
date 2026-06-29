import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export const InstallPWAFooterButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed & open as app)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (navigator as any).standalone === true;
      
      if (isStandaloneMode) {
        setIsInstalled(true);
      }
    };

    // Check if device is iOS
    const checkIos = () => {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIosDevice(isIos);
    };

    checkStandalone();
    checkIos();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem('pwa_installed', 'true');
      toast.success("App installed successfully. Icon may appear on home screen/app drawer in a few seconds.", {
        duration: 6000,
        position: 'top-center'
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIosDevice) {
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // If already installed and running standalone or cached status
  if (isInstalled) {
    return (
      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl">
        <span>✅ App Installed</span>
      </div>
    );
  }

  // Hide button if not installable and not iOS device
  if (!isInstallable && !isIosDevice) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-indigo-650/10 cursor-pointer"
      >
        <Smartphone className="w-4 h-4 animate-bounce" />
        <span>📲 Install App</span>
      </button>

      {/* iOS Safari instructions Modal using Portal */}
      <AnimatePresence>
        {showIosInstructions && createPortal(
          <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs select-none"
            onClick={() => setShowIosInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.4)] max-w-sm w-full overflow-hidden border border-gray-100 dark:border-gray-800 relative mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 sm:p-10">
                <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Share className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-black text-center text-slate-900 dark:text-white mb-2 tracking-tight">
                  Add to Home Screen
                </h3>
                
                <p className="text-center text-slate-550 dark:text-slate-400 mb-6 leading-relaxed font-semibold text-xs">
                  Follow these simple steps to install the SDIET app on your iOS device:
                </p>

                <div className="space-y-4 text-xs font-medium text-slate-650 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-805">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</div>
                    <div className="leading-relaxed text-slate-700 dark:text-slate-300">
                      Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-0.5 text-indigo-500" /> at the bottom of Safari.
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</div>
                    <div className="leading-relaxed text-slate-700 dark:text-slate-300">
                      Scroll down the options list and select <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-indigo-500" />.
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</div>
                    <div className="leading-relaxed text-slate-700 dark:text-slate-300">
                      Tap <strong>Add</strong> in the top right corner to complete.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowIosInstructions(false)}
                  className="w-full mt-6 py-3 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 font-bold rounded-2xl transition-all active:scale-[0.98] text-sm cursor-pointer"
                >
                  Got it
                </button>
              </div>
              
              <button 
                onClick={() => setShowIosInstructions(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-905 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </>
  );
};
