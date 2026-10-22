"use client";
import { useState, useEffect } from "react";
import { Share, PlusSquare, X, Download } from "lucide-react";

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Check if the app is already installed
    const isAppMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isAppMode);

    if (isAppMode) return;

    // 2. Detect iOS devices (Safari doesn't support automatic prompts)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show the manual instruction prompt for iOS after a 2-second delay
      setTimeout(() => setShowPrompt(true), 2000);
    }

    // 3. Intercept the standard Android/Desktop install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Stop the browser's default mini-infobar
      setDeferredPrompt(e); // Save the event so we can trigger it later
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show the native browser prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[1000] p-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="max-w-md mx-auto bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center justify-between gap-4">
        
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-400" /> Install sAhAyAk
          </h3>
          {isIOS ? (
            <p className="text-slate-400 text-xs mt-1 flex items-center flex-wrap gap-1 leading-relaxed">
              Tap <Share className="w-3 h-3 text-blue-400 mx-0.5"/> then <strong className="text-white">Add to Home Screen</strong> <PlusSquare className="w-3 h-3 text-blue-400 mx-0.5"/> to install.
            </p>
          ) : (
            <p className="text-slate-400 text-xs mt-1">
              Add this app to your home screen for instant emergency access.
            </p>
          )}
        </div>

        {!isIOS && (
          <button
            onClick={handleInstall}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] whitespace-nowrap"
          >
            Install App
          </button>
        )}

        <button 
          onClick={() => setShowPrompt(false)} 
          className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
      </div>
    </div>
  );
}