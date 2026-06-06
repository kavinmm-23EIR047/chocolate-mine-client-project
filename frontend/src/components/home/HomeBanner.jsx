import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Gift, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

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
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

  if (loading) {
    return (
      <div className="w-full rounded-2xl sm:rounded-3xl bg-muted/10 animate-pulse border border-border/20"
        style={{ aspectRatio: '16/5' }} />
    );
  }

  if (banners.length === 0) {
    return (
      <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden relative border border-border/20"
        style={{ aspectRatio: '16/5' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-chocolate to-espresso flex items-center justify-center">
          <img src="/logo.png" alt="Logo" className="w-32 object-contain" />
        </div>
      </div>
    );
  }

  const slide = banners[current];

  return (
    <div
      className="banner-root relative w-full overflow-hidden rounded-2xl sm:rounded-3xl group border border-white/10 shadow-premium"
      style={{ aspectRatio: 'var(--banner-ratio, 16/9)' }}
    >
      {/* AI Premium Running Border Styles */}
      <style>{`
        @media (min-width: 640px) {
          .banner-root { aspect-ratio: 16/4.8 !important; }
        }
        @keyframes aiBorderRun {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .ai-running-border {
          background: linear-gradient(90deg, #ff007f, #7928ca, #00dfd8, #ff007f);
          background-size: 400% 400%;
          animation: aiBorderRun 6s ease infinite;
        }
        .ai-btn-glow {
          background: linear-gradient(90deg, #ff007f, #ffaa00, #00dfd8, #ff007f);
          background-size: 400% 400%;
          animation: aiBorderRun 5s ease infinite;
        }
      `}</style>

      <AnimatePresence mode="wait">
        <motion.div
          key={slide._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="absolute inset-0"
          onClick={() => slide.link && (window.location.href = slide.link)}
          style={{ cursor: slide.link ? 'pointer' : 'default' }}
        >
          {/* Background Image with optimized filter for readability */}
          <img
            src={slide.image}
            alt={slide.title}
            className="absolute inset-0 w-full h-full select-none"
            style={{
              objectFit: 'cover',
              objectPosition: 'center center',
              filter: 'brightness(0.7) contrast(1.02)'
            }}
            draggable={false}
          />

          {/* Vignette Gradient Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.3) 100%)',
                'linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 70%)',
              ].join(', '),
            }}
          />

          {/* ═══════════════════════════════════════════════ */}
          {/* TOP-LEFT: AI Running Border Badge & Title       */}
          {/* ═══════════════════════════════════════════════ */}
          <div
            className="absolute top-0 left-0 right-0 z-10 flex flex-col items-start justify-start pointer-events-none"
            style={{ padding: 'clamp(12px, 3.5vw, 28px)' }}
          >
            <div className="max-w-[70%] flex flex-col gap-1.5">

              {/* Subtitle Line (Optional) */}
              {(slide.cornerText || slide.subtitle) && (
                <span className="font-bold uppercase tracking-widest text-[8px] sm:text-[10px] text-white/30 pl-0.5 select-none">
                  {slide.cornerText || slide.subtitle}
                </span>
              )}

              {/* Title Container with AI Animated Running Border */}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="ai-running-border p-[1.2px] rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.4)] w-fit"
              >
                <div
                  className="flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full"
                  style={{ background: 'rgba(10, 10, 10, 0.82)', backdropFilter: 'blur(10px)' }}
                >
                  <Gift size={13} className="text-white/80 shrink-0" />
                  <h2
                    style={{
                      fontSize: 'clamp(11px, 2.2vw, 16px)',
                      fontWeight: 700,
                      lineHeight: 1.2,
                      letterSpacing: '0.02em',
                      color: 'rgba(245, 245, 245, 0.95)',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      margin: 0,
                    }}
                  >
                    {slide.title}
                  </h2>
                </div>
              </motion.div>

            </div>
          </div>

          {/* ═══════════════════════════════════════════════ */}
          {/* BOTTOM-RIGHT: Premium Interactive Action Button  */}
          {/* ═══════════════════════════════════════════════ */}
          {slide.link && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="ai-btn-glow absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-20 p-[1.5px] rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.5)] group/btn transition-transform duration-300 hover:scale-[1.03] pointer-events-auto"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = slide.link;
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-black uppercase tracking-wider text-white transition-colors duration-300 active:scale-95"
                style={{
                  background: '#0d0d0d',
                  fontSize: 'clamp(9px, 1.4vw, 11px)',
                }}
              >
                <span>{slide.buttonText || 'Explore Now'}</span>
                <ArrowRight
                  size={12}
                  className="text-white transition-transform duration-300 group-hover/btn:translate-x-1"
                />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Slide Navigation Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            aria-label="Previous slide"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/45 text-white backdrop-blur-sm border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{ width: 'clamp(24px, 4vw, 34px)', height: 'clamp(24px, 4vw, 34px)' }}
          >
            <ChevronLeft size={14} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            aria-label="Next slide"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/45 text-white backdrop-blur-sm border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{ width: 'clamp(24px, 4vw, 34px)', height: 'clamp(24px, 4vw, 34px)' }}
          >
            <ChevronRight size={14} />
          </button>

          {/* Smooth Pagination Dots */}
          <div className="absolute bottom-3 left-3 sm:left-5 flex gap-1 z-20 items-center">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: current === i ? '14px' : '4px',
                  height: '4px',
                  borderRadius: '999px',
                  background: current === i ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HomeBanner;