import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

const ImageWithSkeleton = ({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  aspectRatio = '',
  loading = 'lazy',
  onClick,
  style = {},
  imgStyle = {},
  fallback,
  showSparkles = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset loading state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  if (!src || src === 'none' || src.trim() === '') {
    return (
      <div className={`relative overflow-hidden w-full h-full flex items-center justify-center ${containerClassName} ${aspectRatio}`} style={{ background: 'var(--card-soft)', ...style }}>
        {fallback || (
          <div className="flex flex-col items-center justify-center p-2 text-center">
            <ImageIcon className="w-5 h-5 text-[var(--muted)] opacity-50 mb-1" />
            <span className="text-[8px] font-bold tracking-widest text-[var(--muted)] uppercase opacity-70">No Image</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden w-full h-full ${containerClassName} ${aspectRatio}`}
      onClick={onClick}
      style={{ background: isLoaded ? 'transparent' : 'var(--card-soft)', ...style }}
    >
      {/* ── SPARKLE SKELETON LOADING OVERLAY ── */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden pointer-events-none select-none"
            style={{ background: 'var(--card-soft)' }}
          >
            {/* Shimmer Light Beam Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent -skew-x-12"
              animate={{ x: ['-150%', '200%'] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
            />

            {/* Subtle Gradient Pulse */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-500/10"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />

            {/* Center Sparkles Icon */}
            {showSparkles && (
              <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 p-2">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                    className="p-2.5 rounded-full bg-amber-500/15 dark:bg-amber-400/15 border border-amber-500/25 dark:border-amber-400/25 shadow-sm backdrop-blur-xs"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" strokeWidth={2.2} />
                  </motion.div>

                  {/* Pulsing Outer Sparkle Glow */}
                  <motion.div
                    animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.4, 0.9, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                  </motion.div>
                </div>

                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-800/70 dark:text-amber-300/70 animate-pulse">
                  Loading...
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── IMAGE / FALLBACK ── */}
      {hasError ? (
        fallback || (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center" style={{ background: 'var(--card-soft)' }}>
            <ImageIcon className="w-6 h-6 text-[var(--muted)] opacity-50 mb-1" />
            <span className="text-[8px] font-bold tracking-widest text-[var(--muted)] uppercase opacity-70">Image Unavailable</span>
          </div>
        )
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} transition-opacity duration-500 ease-in-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={imgStyle}
          {...props}
        />
      )}
    </div>
  );
};

export default ImageWithSkeleton;
