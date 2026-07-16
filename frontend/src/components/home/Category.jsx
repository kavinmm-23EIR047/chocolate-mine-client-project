import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import fallbackCakeImg from '../../assets/cake.png';

const FALLBACK_IMAGE = fallbackCakeImg;
const IMAGE_BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

const HighlightCircle = ({ image, name, isActive, onClick, index }) => {
  // Premium designer backdrops matching the reference UI perfectly
  const renderPremiumBackdrop = (idx) => {
    const type = idx % 4;
    if (type === 0) {
      return (
        <div className="absolute inset-0 flex items-center justify-center scale-110">
          <div className="absolute w-full h-full bg-[#FF007F]/20 animate-[spin_40s_linear_infinite]" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          <div className="absolute w-[75%] h-[75%] bg-[#FF007F]/10 rounded-full blur-sm" />
        </div>
      );
    } else if (type === 1) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-full h-full bg-[#2AD1B5]/20 rounded-full" />
          <div className="absolute w-full h-[40%] bg-[#2AD1B5]/20 rounded-full rotate-45" />
          <div className="absolute w-full h-[40%] bg-[#2AD1B5]/20 rounded-full -rotate-45" />
          <div className="absolute w-[40%] h-full bg-[#2AD1B5]/20 rounded-full rotate-45" />
          <div className="absolute w-[40%] h-full bg-[#2AD1B5]/20 rounded-full -rotate-45" />
        </div>
      );
    } else if (type === 2) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[115%] h-[65%] bg-[#EAB308]/20 rounded-[30px_50px_30px_50px] transform -rotate-3" />
          <div className="absolute w-[95%] h-[50%] bg-[#EAB308]/10 rounded-[50px_30px_50px_30px] transform rotate-6" />
        </div>
      );
    } else {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[105%] h-[105%] bg-[#D946EF]/20 rounded-[40%_60%_60%_40%/_60%_50%_50%_40%]" />
          <div className="absolute w-[85%] h-[85%] bg-[#D946EF]/10 rounded-[50%_40%_45%_55%/_40%_45%_55%_60%] rotate-12" />
        </div>
      );
    }
  };

  const getImageUrl = (src) => {
    if (!src) return FALLBACK_IMAGE;
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      return src;
    }
    const cleanSrc = src.startsWith('/') ? src : `/${src}`;
    return `${IMAGE_BASE_URL}${cleanSrc}`;
  };

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center group outline-none shrink-0 transition-transform active:scale-95 min-w-[120px] sm:min-w-[140px] pt-10 pb-2 relative z-20"
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full z-0 transition-transform duration-500 group-hover:scale-115 group-hover:rotate-12">
          {renderPremiumBackdrop(index)}
        </div>

        <div className="absolute z-10 w-24 h-24 sm:w-28 sm:h-28 -top-6 -right-2 flex items-center justify-center filter drop-shadow-[0_14px_20px_rgba(0,0,0,0.35)] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-3">
          <img
            src={getImageUrl(image)}
            alt={name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = FALLBACK_IMAGE;
            }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 mt-3 sm:mt-4">
        <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-center px-1 text-heading group-hover:text-primary transition-colors duration-300">
          {name}
        </span>
        <div className={`h-[2px] rounded-full bg-primary transition-all duration-300 ${isActive ? 'w-10' : 'w-0 group-hover:w-10'}`} />
      </div>
    </button>
  );
};

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
        const all = { name: 'All', image: FALLBACK_IMAGE };
        const custom = { name: 'Custom Cakes', image: FALLBACK_IMAGE, isCustom: true };
        setCategories([all, ...backend, custom]);
      } catch (error) {
        setCategories([{ name: 'All', image: FALLBACK_IMAGE }]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length <= 1 || !scrollRef.current) return;
    const container = scrollRef.current;

    let isHovered = false;
    const handlePause = () => isHovered = true;
    const handleResume = () => isHovered = false;

    container.addEventListener('mouseenter', handlePause);
    container.addEventListener('mouseleave', handleResume);
    container.addEventListener('touchstart', handlePause, { passive: true });
    container.addEventListener('touchend', handleResume, { passive: true });

    const interval = setInterval(() => {
      if (isHovered) return;
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      
      // If we are at the end (or very close to it), scroll back to start
      if (container.scrollLeft >= maxScroll - 20) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Scroll exactly one card width + gap
        const itemWidth = container.firstElementChild?.offsetWidth || 140;
        const gap = 32; // gap-8
        container.scrollBy({ left: itemWidth + gap, behavior: 'smooth' });
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      container.removeEventListener('mouseenter', handlePause);
      container.removeEventListener('mouseleave', handleResume);
      container.removeEventListener('touchstart', handlePause);
      container.removeEventListener('touchend', handleResume);
    };
  }, [categories.length]);

  if (loading) return null;

  return (
    /* The main section container has no background now, matches page background */
    <section className="pt-2 pb-12 md:pb-20 lg:pb-24 relative w-full mx-auto overflow-hidden transition-colors duration-300">

      <div className="flex flex-col items-center justify-center px-4 mb-4 mt-2 relative z-20">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-6 sm:w-12 h-[2px] bg-primary/40 rounded-full" />
          <h2 className="text-base sm:text-lg lg:text-xl font-black tracking-[0.15em] uppercase text-heading text-center font-serif transition-colors duration-300">
            Shop by Category
          </h2>
          <div className="w-8 sm:w-16 h-[2px] bg-primary/40 rounded-full" />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto justify-start 2xl:justify-between gap-6 sm:gap-8 lg:gap-12 2xl:gap-0 px-6 md:px-16 pb-2 pt-0 scroll-smooth [&::-webkit-scrollbar]:hidden items-start relative z-20 w-full max-w-[1800px] mx-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat, index) => (
          <HighlightCircle
            key={cat.name}
            index={index}
            image={cat.image}
            name={cat.label || (cat.name ? cat.name.replace(/-/g, ' ') : '')}
            isActive={activeCategory === cat.name}
            onClick={() => {
              if (cat.isCustom) {
                navigate('/custom-cake');
              } else {
                setActiveCategory(cat.name);
                // Also scroll to the collections section
                const el = document.getElementById('main-catalog');
                if (el) {
                  const offset = el.getBoundingClientRect().top + window.pageYOffset - 100;
                  window.scrollTo({ top: offset, behavior: 'smooth' });
                }
              }
            }}
          />
        ))}
      </div>

      {/* Swipe Indicator & Controls */}
      <div className="flex items-center justify-center gap-3 relative z-20 pb-4 text-muted opacity-80">
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: -250, behavior: 'smooth' })}
          className="p-1 hover:text-primary transition-colors cursor-pointer outline-none"
        >
          <ChevronLeft size={16} className="animate-pulse" />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] cursor-default">Swipe</span>
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: 250, behavior: 'smooth' })}
          className="p-1 hover:text-primary transition-colors cursor-pointer outline-none"
        >
          <ChevronRight size={16} className="animate-pulse" />
        </button>
      </div>

      {/* 🍫 BOTTOM: Realistic Chocolate Melting Drip SVG Frame */}
      <div 
        className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 pointer-events-none"
        style={{ filter: 'drop-shadow(0px 8px 4px rgba(25, 10, 5, 0.4))' }}
      >
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-[140%] md:w-full h-16 md:h-24 text-[#351810] dark:text-[#E8D3CB] fill-current">
          <path d="M1200,0H0V28.05c31.13,0,51.84,54.49,85.64,54.49,38.8,0,49.27-37.49,84.71-37.49,37,0,52.33,78.36,92.51,78.36,36.56,0,52.34-45.72,86.6-45.72,31.7,0,49.09,19.34,79.52,19.34,35,0,52.48-51.52,87.89-51.52,38.65,0,50.15,92.4,89.5,92.4,36.93,0,52-65.73,88.16-65.73,34.13,0,50,33.56,83.18,33.56,38.16,0,50.93-70.36,89-70.36,36.08,0,51.5,41,86.35,41,32.22,0,50.05-18.79,81.42-18.79,37,0,50.7,60.67,88.75,60.67,36.19,0,51-51.49,85.62-51.49,32.41,0,49.33,26.78,81.15,26.78Z"></path>
        </svg>
      </div>
    </section>
  );
};