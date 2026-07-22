import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import fallbackCakeImg from '../../assets/cake.png';
import allCategoryImg from '../../assets/all.png';

const FALLBACK_IMAGE = fallbackCakeImg;
const IMAGE_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
  : (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

export const CategoryCircles = ({ activeCategory, setActiveCategory }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get('/categories');
        const backend = response.data?.data || [];

        // Find if 'All' exists in backend
        const allCategoryIndex = backend.findIndex(c => c.name.toLowerCase() === 'all');
        let allCategory = { name: 'All', image: allCategoryImg };

        if (allCategoryIndex !== -1) {
          allCategory.image = allCategoryImg;
          backend.splice(allCategoryIndex, 1);
        }

        // Find if 'Custom Cakes' exists in backend
        const customCakeIndex = backend.findIndex(
          c => c.name.toLowerCase() === 'custom cakes' || c.name.toLowerCase() === 'custom cake'
        );

        if (customCakeIndex !== -1) {
          backend[customCakeIndex].isCustom = true;
          setCategories([allCategory, ...backend]);
        } else {
          const custom = { name: 'Custom Cakes', image: FALLBACK_IMAGE, isCustom: true };
          setCategories([allCategory, ...backend, custom]);
        }
      } catch (error) {
        setCategories([{ name: 'All', image: allCategoryImg }]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (categories.length <= 1 || !scrollRef.current) return;
    const container = scrollRef.current;

    let isHovered = false;
    const handlePause = () => (isHovered = true);
    const handleResume = () => (isHovered = false);

    container.addEventListener('mouseenter', handlePause);
    container.addEventListener('mouseleave', handleResume);
    container.addEventListener('touchstart', handlePause, { passive: true });
    container.addEventListener('touchend', handleResume, { passive: true });

    const interval = setInterval(() => {
      if (isHovered) return;
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);

      if (container.scrollLeft >= maxScroll - 20) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const itemWidth = container.firstElementChild?.offsetWidth || 180;
        const gap = 16;
        container.scrollBy({ left: itemWidth + gap, behavior: 'smooth' });
      }
    }, 3500);

    return () => {
      clearInterval(interval);
      container.removeEventListener('mouseenter', handlePause);
      container.removeEventListener('mouseleave', handleResume);
      container.removeEventListener('touchstart', handlePause);
      container.removeEventListener('touchend', handleResume);
    };
  }, [categories.length]);

  const getImageUrl = (src) => {
    if (!src) return FALLBACK_IMAGE;
    if (
      src.startsWith('http://') ||
      src.startsWith('https://') ||
      src.startsWith('data:') ||
      src.includes('/assets/') ||
      src.includes('/src/')
    ) {
      return src;
    }
    const cleanSrc = src.startsWith('/') ? src : `/${src}`;
    return `${IMAGE_BASE_URL}${cleanSrc}`;
  };

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -260 : 260;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  if (loading) return null;

  return (
    <section className="pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-10 lg:pb-14 relative z-10 w-full overflow-hidden bg-[var(--background)] border-b border-[var(--border)]/20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── HEADER SECTION ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] border border-[var(--primary)]/20 flex items-center gap-1.5 shadow-xs">
                <Sparkles size={12} className="text-amber-500 animate-pulse" />
                Curated Range
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight uppercase text-[var(--heading)]">
              Shop By Category
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] font-medium max-w-lg">
              Explore our artisan handcrafted cakes, desserts, bento treats & custom delights.
            </p>
          </div>

          {/* Desktop Navigation Controls */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={() => scroll('left')}
              aria-label="Previous categories"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[var(--border)]/50 bg-[var(--card)] hover:bg-[var(--primary)] hover:text-[var(--button-text)] text-[var(--heading)] flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Next categories"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[var(--border)]/50 bg-[var(--card)] hover:bg-[var(--primary)] hover:text-[var(--button-text)] text-[var(--heading)] flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ── CATEGORY CARDS CAROUSEL ── */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-3 sm:gap-4 lg:gap-6 pb-4 pt-1 scroll-smooth [&::-webkit-scrollbar]:hidden snap-x snap-mandatory items-stretch"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat, index) => {
            const isActive = activeCategory === cat.name;
            const displayName = cat.label || (cat.name ? cat.name.replace(/-/g, ' ') : '');
            const categoryImageUrl = getImageUrl(cat.image);

            return (
              <div
                key={cat.name || index}
                onClick={() => {
                  if (cat.isCustom) {
                    navigate('/custom-cake');
                  } else {
                    setActiveCategory(cat.name);
                    const el = document.getElementById('main-catalog');
                    if (el) {
                      const offset = el.getBoundingClientRect().top + window.pageYOffset - 100;
                      window.scrollTo({ top: offset, behavior: 'smooth' });
                    }
                  }
                }}
                className="snap-start shrink-0 w-[130px] sm:w-[160px] md:w-[180px] lg:w-[200px] group cursor-pointer select-none"
              >
                <div
                  className={`h-full flex flex-col items-center justify-between p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 relative overflow-hidden text-center ${
                    isActive
                      ? 'bg-[var(--card)] border-[var(--primary)] ring-2 ring-[var(--primary)]/30 shadow-lg -translate-y-1'
                      : 'bg-[var(--card)] border-[var(--border)]/40 hover:border-[var(--primary)]/40 hover:shadow-xl hover:-translate-y-1.5'
                  }`}
                >
                  {/* ── OPACITY-BASED BACKGROUND IMAGE ── */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-500 opacity-15 group-hover:opacity-25 group-hover:scale-110 pointer-events-none"
                    style={{ backgroundImage: `url(${categoryImageUrl})` }}
                  />
                  
                  {/* Dark/Theme Tint Overlay for Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[var(--card)]/80 via-[var(--card)]/90 to-[var(--card)] transition-opacity duration-300 pointer-events-none" />

                  {/* Circular Image Container with Ambient Glow */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-3 mt-1 shrink-0 z-10">
                    <div className="absolute inset-0 rounded-full bg-[var(--primary)]/10 group-hover:bg-[var(--primary)]/20 transition-colors duration-300" />
                    <div className="absolute inset-1 rounded-full border border-[var(--primary)]/20 group-hover:border-[var(--primary)]/50 transition-colors duration-300" />
                    
                    <img
                      src={categoryImageUrl}
                      alt={displayName}
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain relative z-10 transition-transform duration-500 ease-out group-hover:scale-110 drop-shadow-md"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>

                  {/* Title & Active Pill Indicator */}
                  <div className="flex flex-col items-center gap-1.5 w-full relative z-10 min-h-[40px] justify-center">
                    <span className="text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wider text-[var(--heading)] group-hover:text-[var(--primary)] transition-colors text-center break-words leading-tight w-full px-1">
                      {displayName}
                    </span>

                    <div className="flex items-center gap-1 mt-auto">
                      <div
                        className={`h-1 rounded-full bg-[var(--primary)] transition-all duration-300 ${
                          isActive ? 'w-8' : 'w-0 group-hover:w-6 opacity-60'
                        }`}
                      />
                      {isActive && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)] hidden sm:inline-block">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover Arrow Icon Pill */}
                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-1 z-10">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                      <ArrowRight size={10} className="sm:w-3 sm:h-3" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── MOBILE SCROLL INDICATOR ── */}
        <div className="flex sm:hidden items-center justify-center gap-2 mt-3 text-[var(--muted)]">
          <ChevronLeft size={14} className="animate-pulse text-[var(--primary)]/70" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Swipe to Explore</span>
          <ChevronRight size={14} className="animate-pulse text-[var(--primary)]/70" />
        </div>

      </div>
    </section>
  );
};

export default CategoryCircles;