import React, { useEffect, useState } from 'react';
import { Smartphone, X } from 'lucide-react';

export const OrientationNotice: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 800;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div
      id="orientation-hint-pill"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b]/95 backdrop-blur-md border border-amber-500/40 text-amber-200 px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-[11px] font-mono font-medium select-none"
    >
      <Smartphone size={14} className="rotate-90 text-amber-400" />
      <span>Melhor experiência em modo paisagem (horizontal)</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="ml-1 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
      >
        <X size={13} />
      </button>
    </div>
  );
};
