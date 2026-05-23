import React, { useEffect, useState } from 'react';
import LottieImport from 'lottie-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Import your custom Lottie JSON animation file
import brandAnimation from '../assets/brand-loader.json';

// Safely resolve the Lottie component function in both ESM and CJS bundling environments
const Lottie = LottieImport.default || LottieImport;

export default function BrandIntroLoader({ show = false, onFinish, logoHoldMs = 3000 }) {
  const { isDark } = useTheme();
  
  // Background colors corresponding to your premium design system
  const bg = isDark ? '#0D0706' : '#FAF8F5';

  useEffect(() => {
    if (!show) return;

    // Automatically call onFinish after the logoHoldMs duration to transition into the main app
    const timer = setTimeout(() => {
      onFinish?.();
    }, logoHoldMs);

    return () => clearTimeout(timer);
  }, [show, logoHoldMs, onFinish]);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="brand-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[240] flex flex-col items-center justify-center overflow-hidden px-5"
          style={{ background: bg }}
        >
          {/* Subtle elegant background radial glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-60"
            style={{
              background: isDark
                ? 'radial-gradient(circle at 50% 50%, rgba(198, 156, 109, 0.15), transparent 70%)'
                : 'radial-gradient(circle at 50% 50%, rgba(59, 31, 27, 0.05), transparent 70%)',
            }}
          />

          <div className="relative flex flex-col items-center max-w-[360px] sm:max-w-[460px] w-full">
            {/* Play your custom Lottie .json animation */}
            <Lottie
              animationData={brandAnimation}
              loop={true}
              autoplay={true}
              style={{ width: '100%', height: 'auto' }}
            />
            
            {/* Optional elegant brand tagline */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.8, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-6 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.35em] text-center"
              style={{ color: isDark ? '#F5E6DA' : '#3B1F1B' }}
            >
              The Chocolate Mine
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
