import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import api from '../../utils/api';
import fallbackCakeImg from '../../assets/cake.png';
import allCategoryImg from '../../assets/all.png';
import { getOptimizedCloudinaryUrl } from '../../utils/cloudinary';

const FALLBACK_IMAGE = fallbackCakeImg;
const IMAGE_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
  : (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

export const CategoryCircles = ({ activeCategory, setActiveCategory }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [isDraggingTrack, setIsDraggingTrack] = useState(false);
  const scrollRef = useRef(null);
  const progressTrackRef = useRef(null);

  // Mouse Drag on Container State
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const handleScroll = useCallback(() => {
    if (scrollRef.current && !isDraggingTrack) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollRatio(Math.min(1, Math.max(0, scrollLeft / maxScroll)));
      }
    }
  }, [isDraggingTrack]);

  // Mouse Drag Handlers for Container
  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftPos(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftPos - walk;
  };

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

        backend.sort((a, b) => {
          const aIsChoco = (a.name || a.label || '').toLowerCase().includes('choco');
          const bIsChoco = (b.name || b.label || '').toLowerCase().includes('choco');
          if (aIsChoco && !bIsChoco) return -1;
          if (!aIsChoco && bIsChoco) return 1;
          return 0;
        });

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

  // Auto-scroll effect (2.4s speed)
  useEffect(() => {
    if (categories.length <= 1 || !scrollRef.current || isDraggingTrack || isMouseDown) return;
    const container = scrollRef.current;

    let isHovered = false;
    const handlePause = () => (isHovered = true);
    const handleResume = () => (isHovered = false);

    container.addEventListener('mouseenter', handlePause);
    container.addEventListener('mouseleave', handleResume);
    container.addEventListener('touchstart', handlePause, { passive: true });
    container.addEventListener('touchend', handleResume, { passive: true });

    const interval = setInterval(() => {
      if (isHovered || isMouseDown) return;
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);

      if (container.scrollLeft >= maxScroll - 20) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const items = Array.from(container.children);
        const containerCenter = container.scrollLeft + container.clientWidth / 2;
        const currentIndex = items.reduce((closestIndex, item, index) => {
          const itemCenter = item.offsetLeft + item.offsetWidth / 2;
          const closestCenter = items[closestIndex].offsetLeft + items[closestIndex].offsetWidth / 2;
          return Math.abs(itemCenter - containerCenter) < Math.abs(closestCenter - containerCenter)
            ? index
            : closestIndex;
        }, 0);
        const nextItem = items[Math.min(currentIndex + 1, items.length - 1)];
        if (nextItem) {
          const nextScrollLeft = nextItem.offsetLeft - (container.clientWidth - nextItem.offsetWidth) / 2;
          container.scrollTo({ left: Math.max(0, Math.min(maxScroll, nextScrollLeft)), behavior: 'smooth' });
        }
      }
    }, 5500);

    return () => {
      clearInterval(interval);
      container.removeEventListener('mouseenter', handlePause);
      container.removeEventListener('mouseleave', handleResume);
      container.removeEventListener('touchstart', handlePause);
      container.removeEventListener('touchend', handleResume);
    };
  }, [categories.length, isDraggingTrack, isMouseDown]);

  const updateScrollByX = useCallback((clientX) => {
    if (!progressTrackRef.current || !scrollRef.current) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / (rect.width > 0 ? rect.width : 1)));
    setScrollRatio(ratio);
    const { scrollWidth, clientWidth } = scrollRef.current;
    scrollRef.current.scrollLeft = ratio * (scrollWidth - clientWidth);
  }, []);

  const handlePointerDown = (e) => {
    setIsDraggingTrack(true);
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    updateScrollByX(clientX);
  };

  useEffect(() => {
    if (!isDraggingTrack) return;

    const handlePointerMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      if (clientX !== undefined) {
        updateScrollByX(clientX);
      }
    };

    const handlePointerUp = () => {
      setIsDraggingTrack(false);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDraggingTrack, updateScrollByX]);

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
    <section className="py-10 sm:py-14 lg:py-16 relative z-10 w-full bg-transparent">
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
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--heading)]">
              Shop By Category
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] font-normal max-w-md">
              Explore our artisan handcrafted cakes, desserts, bento treats & custom delights.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => scroll('left')}
              aria-label="Previous categories"
              className="w-10 h-10 rounded-full border border-[var(--border)] bg-transparent hover:bg-[var(--primary)] hover:border-[var(--primary)] hover:text-[var(--button-text)] text-[var(--heading)] flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Next categories"
              className="w-10 h-10 rounded-full border border-[var(--border)] bg-transparent hover:bg-[var(--primary)] hover:border-[var(--primary)] hover:text-[var(--button-text)] text-[var(--heading)] flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── CATEGORY CIRCLES CAROUSEL WITH MOUSE DRAG & TOUCH SWIPE ── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="relative w-full max-w-full flex overflow-x-auto gap-4 sm:gap-6 lg:gap-8 pb-4 pt-2 px-4 sm:px-8 pr-20 scroll-smooth select-none cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden snap-x snap-mandatory items-start"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollPaddingInline: '1rem' }}
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
                  } else if (cat.name === 'All') {
                    navigate('/shop');
                  } else {
                    navigate(`/shop?category=${encodeURIComponent(cat.name)}`);
                  }
                }}
                className="snap-center shrink-0 flex flex-col items-center cursor-pointer select-none w-[110px] sm:w-[130px] md:w-[150px] pointer-events-auto"
              >
                <div className={`w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border border-[var(--border)] bg-transparent shadow-sm overflow-hidden transition-transform duration-300 ${isActive ? 'scale-105 border-[var(--primary)] shadow-md' : 'hover:scale-[1.03]'}`}>
                  <img
                    src={getOptimizedCloudinaryUrl(categoryImageUrl, 300)}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>

                <div className="flex flex-col items-center text-center px-1 max-w-full mt-3">
                  <span className={`text-sm font-semibold tracking-wide transition-colors duration-200 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--heading)]'}`}>
                    {displayName}
                  </span>
                  <span className={`mt-2 h-1.5 rounded-full bg-[var(--primary)] transition-all duration-300 ${isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'}`} />
                </div>
              </div>
            );
          })}
        </div>



      </div>
    </section>
  );
};

export default CategoryCircles;
