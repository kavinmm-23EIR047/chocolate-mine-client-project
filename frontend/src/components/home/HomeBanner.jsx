import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import Logo from '../Logo';

const HomeBanner = () => {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const res = await api.get('/banners/active');
        setBanners(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [banners.length, current]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

  const handleBannerClick = (e) => {
    const activeSlide = banners[current];
    if (!activeSlide?.link) return;
    if (e.target.closest('.interactive-action-node')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    if (banners.length > 1 && clickX < rect.width * 0.35) {
      prevSlide();
    } else {
      window.location.href = activeSlide.link;
    }
  };

  if (loading) {
    return (
      <div className="w-full rounded-[16px] sm:rounded-[24px] bg-muted/10 animate-pulse border border-border/20"
        style={{ aspectRatio: '16/5' }} />
    );
  }

  if (banners.length === 0) {
    return (
      <div className="w-full rounded-[16px] sm:rounded-[24px] overflow-hidden relative border border-border/20"
        style={{ aspectRatio: '16/5' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-chocolate to-espresso flex items-center justify-center">
          <Logo className="w-32 h-32" />
        </div>
      </div>
    );
  }

  const slide = banners[current];

  return (
    <div
      className="banner-root relative w-full overflow-hidden rounded-[16px] sm:rounded-[24px] shadow-premium select-none border border-border/20"
      style={{ aspectRatio: 'var(--banner-ratio, 16/9)' }}
    >
      <style>{`
        @media (max-width: 480px) {
          .banner-root { aspect-ratio: 16/7.5 !important; } 
        }
        @media (min-width: 481px) {
          .banner-root { aspect-ratio: 16/4.5 !important; }
        }
        @media (min-width: 1920px) {
          .banner-root { aspect-ratio: 16/3.9 !important; }
        }

        .premium-glass {
          background: rgba(15, 15, 15, 0.65);
          backdrop-filter: blur(12px) saturate(140%);
          -webkit-backdrop-filter: blur(12px) saturate(140%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
      `}</style>

      {/* Solid base layer behind transitions */}
      <div className="absolute inset-0 bg-background transition-colors duration-300 -z-10" />

      {/* Slide transition zone */}
      <AnimatePresence>
        <motion.div
          key={slide._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 w-full h-full"
          onClick={handleBannerClick}
          style={{ cursor: slide.link ? 'pointer' : 'default' }}
        >
          {/* Background Image - Filters Removed */}
          <img
            src={slide.image}
            alt={slide.title || "Banner Image"}
            className="absolute inset-0 w-full h-full select-none object-cover"
            style={{ objectPosition: 'center center' }}
            draggable={false}
          />

          {/* Vignette Gradient Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)',
                'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 70%)',
              ].join(', '),
            }}
          />

          {/* TOP-LEFT: Dynamic Title Badge */}
          <div
            className="absolute top-0 left-0 right-0 z-10 flex flex-col items-start justify-start pointer-events-none"
            style={{ padding: 'clamp(10px, 3vw, 20px)' }}
          >
            <div className="max-w-[85%] flex flex-col gap-1">
              {(slide.cornerText || slide.subtitle) && (
                <span className="font-semibold uppercase tracking-widest text-[8px] sm:text-[9px] text-white/40 pl-0.5 select-none">
                  {slide.cornerText || slide.subtitle}
                </span>
              )}

              <div className="premium-glass flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit pointer-events-auto opacity-80">
                <Gift size={12} className="text-white shrink-0" />
                <h2
                  style={{
                    fontSize: 'clamp(10px, 2vw, 13px)',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    letterSpacing: '0.01em',
                    color: '#ffffff',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    margin: 0,
                  }}
                >
                  {slide.title || 'Special Offer'}
                </h2>
              </div>
            </div>
          </div>

          {/* BOTTOM-RIGHT: Action Button */}
          <div className="interactive-action-node absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-20 transition-transform duration-300 hover:scale-[1.02] pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (slide.link) window.location.href = slide.link;
              }}
              className="premium-glass flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-bold uppercase tracking-wider text-white/80 transition-all duration-200 active:scale-95 hover:bg-white/10 hover:text-white"
              style={{
                fontSize: 'clamp(8px, 1.2vw, 10px)',
                minWidth: 0,
                minHeight: 0
              }}
            >
              <span>{slide.buttonText || 'Explore Now'}</span>
              <ArrowRight size={10} className="shrink-0" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-3 sm:left-4 flex gap-1.5 z-20 items-center interactive-action-node">
          {banners.map((_, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrent(i);
                }
              }}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: current === i ? '16px' : '6px',
                height: '6px',
                borderRadius: '999px',
                background: current === i ? '#fff' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeBanner;