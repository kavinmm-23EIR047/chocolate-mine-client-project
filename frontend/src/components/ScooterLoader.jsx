import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ScooterLoader = ({ isVisible, text = 'Preparing your order…' }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-busy="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/85 backdrop-blur-[10px]"
        >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="w-full max-w-[420px] rounded-[2.5rem] border-2 border-[#121212]/20 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.16)] px-10 py-10 text-center"
            >
            {/* Premium Lottie Loader */}
            <div className="relative mx-auto mb-6 w-full max-w-[240px] aspect-[4/3] flex items-center justify-center overflow-hidden">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-2xl border border-[#121212]/10 animate-pulse">
                   <div className="w-8 h-8 border-4 border-[#8B4513]/20 border-t-[#8B4513] rounded-full animate-spin"></div>
                   <p className="mt-3 text-[10px] text-[#8B4513] uppercase font-bold tracking-widest">Loading Animation...</p>
                </div>
              )}
              <iframe
                src="https://lottie.host/embed/28e9311c-fa3b-4032-a697-e3c220fc0b2d/FEbMbZ114x.lottie"
                title="Delivery Scooter Animation"
                onLoad={() => setIframeLoaded(true)}
                className={`w-full h-full border-none outline-none scale-[1.3] pointer-events-none transition-opacity duration-300 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
              ></iframe>
            </div>

            <p className="text-[17px] font-semibold text-[#121212] leading-snug tracking-tight">
              {text}
            </p>
            <p className="mt-2 text-xs text-[#121212]/60 font-medium">
              Please wait — secure checkout
            </p>

            {/* Indeterminate progress line */}
            <div className="relative mt-6 h-1 w-full overflow-hidden rounded-full bg-muted/30">
              <motion.div
                className="absolute left-0 top-0 h-full w-[38%] rounded-full bg-primary"
                animate={{ x: ['-100%', '280%'] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.25,
                  ease: 'linear',
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScooterLoader;
