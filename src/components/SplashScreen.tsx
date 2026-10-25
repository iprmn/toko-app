import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDurationMs = 2100,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fading out after minDurationMs
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      // Wait for fade-out animation to complete (500ms) before removing from DOM
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
        onFinish?.();
      }, 500);
      return () => clearTimeout(removeTimer);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-emerald-800 text-white select-none overflow-hidden transition-all duration-500 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ backgroundColor: '#065F46' }}
    >
      {/* Background Decorative Radial Gradient & Soft Glow */}
      <div className="absolute inset-0 bg-radial from-emerald-700/50 via-emerald-800 to-emerald-950 pointer-events-none" />

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Animated Icon inside White Circle */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Pulsing Ripple Rings */}
          <div className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white/15 animate-splash-ripple" />
          <div className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-emerald-400/20 animate-ping duration-1000" />

          {/* Pristine White Circle with Soft Floating Animation */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white shadow-2xl shadow-emerald-950/40 flex items-center justify-center animate-splash-float border-4 border-white/90">
            {/* Toko App Storefront Vector Icon */}
            <svg
              viewBox="0 0 108 108"
              className="w-20 h-20 sm:w-22 sm:h-22 drop-shadow-sm"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Foundation / Floor */}
              <rect x="24" y="74" width="60" height="7" rx="3" fill="#D97706" />

              {/* Main Building Wall */}
              <rect x="30" y="46" width="48" height="29" fill="#FFFBEB" />

              {/* Store Door */}
              <rect x="35" y="54" width="16" height="21" rx="2" fill="#065F46" />
              <circle cx="48" cy="64" r="1.8" fill="#F59E0B" />

              {/* Store Window Display */}
              <rect x="55" y="54" width="18" height="14" rx="2" fill="#047857" />
              <rect x="57" y="56" width="14" height="9" fill="#A7F3D0" />
              <rect x="54" y="67" width="20" height="3" fill="#F59E0B" />

              {/* Store Signboard / Plang */}
              <rect x="31" y="26" width="46" height="7" rx="2" fill="#F59E0B" />
              <rect x="37" y="28.5" width="34" height="2.5" fill="#FFFBEB" />

              {/* Striped Canopy / Awning Roof */}
              <polygon points="30,33 78,33 83,45 25,45" fill="#EA580C" />
              <polygon points="39.6,33 49.2,33 50.8,45 38,45" fill="#FBBF24" />
              <polygon points="58.8,33 68.4,33 70,45 57.2,45" fill="#FBBF24" />
            </svg>
          </div>
        </div>

        {/* Text Below */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-wide text-white drop-shadow-md animate-in fade-in slide-in-from-bottom-2 duration-700">
          Toko App
        </h1>
        <p className="text-xs sm:text-sm font-medium tracking-widest text-emerald-100 mt-1.5 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-150">
          teman jualan anda
        </p>

        {/* Subtle Bottom Loading Dots */}
        <div className="flex items-center gap-1.5 mt-8">
          <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce duration-600 delay-0" />
          <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce duration-600 delay-150" />
          <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce duration-600 delay-300" />
        </div>
      </div>
    </div>
  );
};
