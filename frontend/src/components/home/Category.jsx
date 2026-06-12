import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';

const HighlightCircle = ({ image, name, isActive, onClick, size = "md" }) => {
  const sizeClasses = {
    sm: "w-12 h-12 sm:w-14 sm:h-14",
    md: "w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32",
  };

  const textSize = {
    sm: "text-[10px] sm:text-xs",
    md: "text-[11px] sm:text-xs lg:text-sm",
  };

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 group outline-none shrink-0 snap-center transition-transform active:scale-95 min-w-[88px] sm:min-w-[118px] lg:min-w-[136px]"
    >
      <div className={`relative ${sizeClasses[size]} transition-all duration-300 ${isActive ? 'scale-105' : 'hover:scale-105'}`}>

        {/* Animated Active Border Border Box */}
        {isActive ? (
          <div className="absolute inset-0 rounded-full active-gradient-border p-[3px]">
            <div className="w-full h-full rounded-full bg-[#121212]" />
          </div>
        ) : (
          <div className="absolute inset-0 border-2 border-border/40 rounded-full group-hover:border-primary/60 transition-all duration-300" />
        )}

        {/* Core Image Content Wrapper */}
        <div className="absolute inset-[3px] rounded-full overflow-hidden bg-muted/10 shadow-inner flex items-center justify-center">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null; // Prevent infinite loops if fallback fails
              e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80';
            }}
          />
        </div>
      </div>

      {/* Label Tag */}
      <span className={`${textSize[size]} font-bold uppercase tracking-wider text-center px-1 transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted/80 group-hover:text-primary'
        }`}>
        {name}
      </span>
    </button>
  );
};

export const CategoryCircles = ({ activeCategory, setActiveCategory }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const autoPlayTimer = useRef(null);
  const [isInteracted, setIsInteracted] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get('/categories');
        const backend = response.data?.data || [];
        const all = { name: 'All', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80' };
        const custom = { name: 'Custom Cakes', image: 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=200&q=80', isCustom: true };
        setCategories([all, ...backend, custom]);
      } catch (error) {
        setCategories([{ name: 'All', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80' }]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Center active element smoothly inside the viewport
  const centerActiveItem = (index) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const children = container.children;
    if (children && children[index]) {
      const element = children[index];
      const containerWidth = container.clientWidth;
      const elementOffset = element.offsetLeft;
      const elementWidth = element.clientWidth;

      container.scrollTo({
        left: elementOffset - containerWidth / 2 + elementWidth / 2,
        behavior: 'smooth',
      });
    }
  };

  // Manage Auto Slide functionality
  useEffect(() => {
    if (categories.length <= 1 || isInteracted) return;

    autoPlayTimer.current = setInterval(() => {
      const currentIndex = categories.findIndex(cat => cat.name === activeCategory);
      const nextIndex = (currentIndex + 1) % categories.length;
      const nextCategory = categories[nextIndex];

      if (nextCategory.isCustom) {
        // Skip over programmatic navigation route actions during autoplay loop
        const wrapIndex = (nextIndex + 1) % categories.length;
        setActiveCategory(categories[wrapIndex].name);
        centerActiveItem(wrapIndex);
      } else {
        setActiveCategory(nextCategory.name);
        centerActiveItem(nextIndex);
      }
    }, 4000); // Transitions to next node every 4 seconds

    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [categories, activeCategory, isInteracted, setActiveCategory]);

  const handleUserInteraction = () => {
    setIsInteracted(true);
    if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
  };

  const scrollHoriz = (direction) => {
    handleUserInteraction();
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  if (loading) return null;

  return (
    <section className="py-6 relative w-full mx-auto overflow-hidden">
      <style>{`
        @property --circle-border-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        .active-gradient-border {
          background: conic-gradient(from var(--circle-border-angle), #fccc63, #fba650, #f15f53, #e2336b, #b9359a, #62529c, #fccc63) border-box;
          animation: spinCircleBorder 3s linear infinite;
        }

        @keyframes spinCircleBorder {
          to {
            --circle-border-angle: 360deg;
          }
        }
      `}</style>

      {/* UNIFIED SCROLL CONTAINER */}
      <div
        ref={scrollRef}
        onScroll={handleUserInteraction}
        className="flex overflow-x-auto gap-5 md:gap-8 tv:gap-12 px-4 md:px-16 pb-4 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden items-start"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat, index) => (
          <HighlightCircle
            key={cat.name}
            image={cat.image}
            name={cat.name}
            isActive={activeCategory === cat.name}
            onClick={() => {
              handleUserInteraction();
              centerActiveItem(index);
              if (cat.isCustom) {
                navigate('/custom-cake');
              } else {
                setActiveCategory(cat.name);
              }
            }}
            size="md"
          />
        ))}
      </div>

      {/* UNIFIED MINIMALIST NAVIGATION ROW (< SWIPE >) */}
      <div className="flex justify-center items-center gap-4 mt-2 mb-2">
        <button
          onClick={() => scrollHoriz('left')}
          className="p-2 text-muted-foreground/60 hover:text-primary transition-colors hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        <span className="text-[10px] md:text-[11px] font-black text-muted-foreground/50 tracking-[0.25em] uppercase select-none">
          SWIPE
        </span>

        <button
          onClick={() => scrollHoriz('right')}
          className="p-2 text-muted-foreground/60 hover:text-primary transition-colors hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Side Fade Masks for Clear Reading Continuity */}
      <div className="hidden md:block absolute top-0 bottom-12 left-0 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="hidden md:block absolute top-0 bottom-12 right-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </section>
  );
};