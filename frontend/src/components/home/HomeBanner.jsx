import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    /*
     * ─── WHY ASPECT RATIO INSTEAD OF FIXED HEIGHT ───────────────────────
     *
     * Fixed px height (e.g. 200px) causes two problems:
     *   • Mobile: banner is TOO SHORT relative to its width → image gets
     *     heavily cropped left/right, text overflows outside the box.
     *   • Desktop: banner is TOO SHORT relative to its width → same crop.
     *
     * aspect-ratio lets the HEIGHT scale with the WIDTH automatically:
     *   • Mobile (~390px wide)  → height ≈ 195px  (16:8 ratio)
     *   • Tablet (~768px wide)  → height ≈ 240px  (16:5 ratio)
     *   • Desktop (~1280px wide)→ height ≈ 300px  (16:4 ratio... but we cap it)
     *
     * We use a RESPONSIVE aspect ratio:
     *   • Mobile:  aspect-ratio 16/8  (squarer, more height to show image)
     *   • sm+:     aspect-ratio 16/5  (wide cinematic, like the original design)
     *
     * Image uses object-cover + object-[center_top] so the subject (person)
     * at the top-right is never cut. The left side (text area) stays clear.
     *
     * Text size uses clamp() so it NEVER overflows the banner on any width.
     * ─────────────────────────────────────────────────────────────────────
     */
    <div
      className="banner-root relative w-full overflow-hidden rounded-2xl sm:rounded-3xl group border border-white/10 shadow-premium"
      style={{
        // Cinematic Floweraura Style
        aspectRatio: 'var(--banner-ratio, 16/9)',
      }}
    >
      {/* Inject responsive aspect-ratio via a style tag approach using Tailwind trick */}
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
          {/* ── Full bleed image ── */}
          <img
            src={slide.image}
            alt={slide.title}
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit: 'cover',
              // Keep subject (typically top-right person) always in frame
              objectPosition: 'center center',
            }}
            draggable={false}
          />

          {/* ── Gradient scrim — left-heavy on desktop, bottom-heavy on mobile ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                // Mobile: bottom scrim for text legibility
                'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.35) 45%, transparent 75%)',
                // Desktop (via a second layer): left scrim
                'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, transparent 75%)',
              ].join(', '),
            }}
          />

          {/* ── Text block ── */}
          <div
            className="absolute inset-0 flex flex-col justify-end sm:justify-center z-10"
            style={{ padding: 'clamp(12px, 4vw, 48px)' }}
          >
            {/* Keep text in left 60% so it never overlaps the subject */}
            <div style={{ maxWidth: '60%' }}>
              {slide.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  style={{
                    fontSize: 'clamp(9px, 2vw, 13px)',
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.65)',
                    marginBottom: '4px',
                  }}
                >
                  {slide.subtitle}
                </motion.p>
              )}

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{
                  /*
                   * clamp(min, preferred, max)
                   * min: never smaller than 15px (readable on tiny screens)
                   * preferred: 4vw scales with viewport width
                   * max: never bigger than 42px (no overflow on desktop)
                   */
                  fontSize: 'clamp(15px, 4vw, 42px)',
                  fontWeight: 900,
                  lineHeight: 1.08,
                  letterSpacing: '-0.02em',
                  color: '#fff',
                  textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                  marginBottom: 'clamp(8px, 2vw, 20px)',
                  // Prevent text from ever wrapping beyond 2 lines
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {slide.title}
              </motion.h2>

              {slide.link && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = slide.link;
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: 'clamp(6px, 1.2vw, 12px) clamp(14px, 3vw, 32px)',
                    borderRadius: '999px',
                    fontSize: 'clamp(9px, 1.5vw, 14px)',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    background: '#fff',
                    color: '#111',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    transition: 'transform 0.15s ease, opacity 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Explore Now
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Nav arrows ── */}
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

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 items-center">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: current === i ? '16px' : '5px',
                  height: '5px',
                  borderRadius: '999px',
                  background: current === i ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
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