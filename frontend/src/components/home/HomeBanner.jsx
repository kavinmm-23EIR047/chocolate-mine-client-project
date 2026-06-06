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
      <style>{`
        @media (min-width: 640px) {
          .banner-root { aspect-ratio: 16/4.8 !important; }
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
          {/* Full Bleed Background Image */}
          <img
            src={slide.image}
            alt={slide.title}
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover', objectPosition: 'center center' }}
            draggable={false}
          />

          {/* Luxury Ambient Overlay for Text Legibility */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 45%, transparent 100%)',
                'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
              ].join(', '),
            }}
          />

          {/* ═══════════════════════════════════════════════ */}
          {/* TOP‑LEFT CORNER: Text Layout & Gradient Border Badge */}
          {/* ═══════════════════════════════════════════════ */}
          <div
            className="absolute top-0 left-0 right-0 z-10 flex flex-col items-start justify-start"
            style={{ padding: 'clamp(16px, 4vw, 36px)' }}
          >
            <div className="max-w-[75%] sm:max-w-[60%] flex flex-col gap-2.5 sm:gap-3">

              {/* Premium Gradient Border Subtitle Badge with Gift Icon */}
              {(slide.cornerText || slide.subtitle) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="p-[1.5px] rounded-full w-fit shadow-lg backdrop-blur-md"
                  style={{
                    // Premium Soft Silver-Gold Metallic Edge
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(201,168,124,0.55) 100%)',
                  }}
                >
                  <div
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
                    style={{ background: 'rgba(20, 20, 20, 0.55)' }}
                  >
                    <Gift size={14} className="text-[#E4C9A7] animate-pulse" />
                    <span className="font-extrabold uppercase tracking-widest text-[9px] sm:text-[11px] text-[#E5E5E5]">
                      {slide.cornerText || slide.subtitle}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Title Statement */}
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{
                  fontSize: 'clamp(16px, 3.8vw, 38px)',
                  fontWeight: 900,
                  lineHeight: 1.12,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  textShadow: '0 2px 10px rgba(0,0,0,0.4)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {slide.title}
              </motion.h2>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════ */}
          {/* BOTTOM‑RIGHT CORNER: Luxury Gold-Gradient Action Button */}
          {/* ═══════════════════════════════════════════════ */}
          {slide.link && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 p-[1.5px] rounded-full shadow-2xl group/btn transition-transform duration-300 hover:scale-[1.03]"
              style={{
                background: 'linear-gradient(135deg, #E4C9A7, #C9A87C, #8B5A2B)',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = slide.link;
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3 rounded-full font-black uppercase tracking-wider text-white transition-colors duration-300 active:scale-95"
                style={{
                  background: '#111111',
                  fontSize: 'clamp(10px, 1.6vw, 13px)',
                }}
              >
                <span>{slide.buttonText || 'Explore Now'}</span>
                <ArrowRight
                  size={14}
                  className="text-[#E4C9A7] transition-transform duration-300 group-hover/btn:translate-x-1"
                />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/55 text-white backdrop-blur-sm border border-white/15 opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{ width: 'clamp(28px, 5vw, 40px)', height: 'clamp(28px, 5vw, 40px)' }}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/55 text-white backdrop-blur-sm border border-white/15 opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{ width: 'clamp(28px, 5vw, 40px)', height: 'clamp(28px, 5vw, 40px)' }}
          >
            <ChevronRight size={16} />
          </button>

          {/* Pagination Indicators */}
          <div className="absolute bottom-4 left-4 sm:left-6 flex gap-1.5 z-20 items-center">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: current === i ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '999px',
                  background: current === i ? '#fff' : 'rgba(255,255,255,0.35)',
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