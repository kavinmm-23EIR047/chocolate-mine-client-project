import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';

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
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Check if image is already cached in browser memory for instant rendering
  useEffect(() => {
    if (!src || src === 'none' || src.trim() === '') return;
    setIsLoaded(false);
    setHasError(false);

    const img = new Image();
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
    }
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
            <ImageIcon className="w-5 h-5 text-[var(--muted)] opacity-40 mb-1" />
            <span className="text-[8px] font-bold tracking-widest text-[var(--muted)] uppercase opacity-60">No Image</span>
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
      {/* ── FAST THUNDER SKELETON SHIMMER OVERLAY (NO SPARKLE ICON) ── */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none select-none bg-[var(--card-soft)]">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/15 to-transparent -skew-x-20"
            style={{
              animation: 'thunderShimmer 0.85s infinite linear'
            }}
          />
          <style>{`
            @keyframes thunderShimmer {
              0% { transform: translateX(-150%) skewX(-20deg); }
              100% { transform: translateX(200%) skewX(-20deg); }
            }
          `}</style>
        </div>
      )}

      {/* ── IMAGE / FALLBACK ── */}
      {hasError ? (
        fallback || (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center" style={{ background: 'var(--card-soft)' }}>
            <ImageIcon className="w-5 h-5 text-[var(--muted)] opacity-40 mb-1" />
            <span className="text-[8px] font-bold tracking-widest text-[var(--muted)] uppercase opacity-60">Unavailable</span>
          </div>
        )
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} transition-opacity duration-200 ease-out ${
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
