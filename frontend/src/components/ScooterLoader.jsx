import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LottieImport from 'lottie-react';
import brandAnimation from '../assets/brand-loader.json';

// Safely resolve the Lottie component function in both ESM and CJS bundling environments
const Lottie = LottieImport.default || LottieImport;

const ScooterLoader = ({ isVisible, text = 'Preparing your order…' }) => {
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
            className="w-full max-w-[320px] rounded-2xl border border-border/50 bg-card/95 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12)] px-8 py-8 text-center"
          >
            {/* Premium Lottie Loader */}
            <div className="relative mx-auto mb-6 w-full max-w-[160px] aspect-square flex items-center justify-center overflow-hidden">
              <Lottie
                animationData={brandAnimation}
                loop={true}
                className="w-full h-full scale-110"
              />
            </div>

            <p className="text-[15px] font-semibold text-heading leading-snug tracking-tight">
              {text}
            </p>
            <p className="mt-2 text-xs text-muted font-medium">
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
