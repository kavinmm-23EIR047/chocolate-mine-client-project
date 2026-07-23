import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
        const itemWidth = container.firstElementChild?.offsetWidth || 160;
        const gap = 20;
        container.scrollBy({ left: itemWidth + gap, behavior: 'smooth' });
      }
    }, 4000);

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
    const amount = direction === 'left' ? -280 : 280;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  if (loading) return null;

  return (
    <section className="py-10 sm:py-14 lg:py-16 relative z-10 w-full overflow-hidden bg-[var(--background)] border-b border-[var(--border)]/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── HEADER SECTION ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold tracking-wide">
                <Sparkles size={13} className="text-amber-500 animate-pulse" />
                Curated Range
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--heading)]">
              Shop By Category
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] font-normal max-w-md">
              Explore our artisan handcrafted cakes, desserts, bento treats & custom delights.
            </p>
          </div>

          {/* Desktop Navigation Controls */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => scroll('left')}
              aria-label="Previous categories"
              className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--primary)] hover:border-[var(--primary)] hover:text-[var(--button-text)] text-[var(--heading)] flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Next categories"
              className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--primary)] hover:border-[var(--primary)] hover:text-[var(--button-text)] text-[var(--heading)] flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── CATEGORY CIRCLES CAROUSEL ── */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 sm:gap-6 lg:gap-8 pb-4 pt-2 scroll-smooth [&::-webkit-scrollbar]:hidden snap-x snap-mandatory items-start"
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
                className="snap-start shrink-0 flex flex-col items-center group cursor-pointer select-none w-[110px] sm:w-[130px] md:w-[150px]"
              >
                {/* Image Ring Avatar Container */}
                <div className="relative mb-3.5 flex items-center justify-center">

                  {/* Subtle active / hover ambient glow */}
                  <div
                    className={`absolute -inset-1.5 rounded-full transition-all duration-300 blur-sm ${isActive
                        ? 'bg-[var(--primary)]/30 opacity-100 scale-105'
                        : 'bg-[var(--primary)]/0 group-hover:bg-[var(--primary)]/15 opacity-0 group-hover:opacity-100'
                      }`}
                  />

                  {/* Outer Border Ring */}
                  <div
                    className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full p-1 transition-all duration-300 ${isActive
                        ? 'bg-gradient-to-tr from-[var(--primary)] via-[var(--primary)]/70 to-[var(--primary)]/30 shadow-md scale-105'
                        : 'bg-[var(--border)]/60 group-hover:bg-[var(--primary)]/50 group-hover:scale-105'
                      }`}
                  >
                    {/* Inner Glass Frame */}
                    <div className="w-full h-full rounded-full bg-[var(--card)] p-2.5 flex items-center justify-center overflow-hidden border border-[var(--border)]/20 shadow-inner">
                      <img
                        src={categoryImageUrl}
                        alt={displayName}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-sm"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_IMAGE;
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Title & Selection Marker */}
                <div className="flex flex-col items-center text-center px-1 max-w-full">
                  <span
                    className={`text-xs sm:text-sm font-semibold tracking-wide transition-colors duration-200 line-clamp-2 ${isActive
                        ? 'text-[var(--primary)] font-bold'
                        : 'text-[var(--heading)] group-hover:text-[var(--primary)]'
                      }`}
                  >
                    {displayName}
                  </span>

                  {/* Active Indicator Bar */}
                  <span
                    className={`h-0.5 rounded-full bg-[var(--primary)] mt-1.5 transition-all duration-300 ${isActive ? 'w-6 opacity-100' : 'w-0 opacity-0 group-hover:w-3 group-hover:opacity-50'
                      }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── MOBILE SCROLL HINT ── */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 mt-4 text-[var(--muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]/60 animate-ping" />
          <span className="text-[10px] font-medium tracking-wider uppercase">Swipe to explore</span>
        </div>

      </div>
    </section>
  );
};

export default CategoryCircles;