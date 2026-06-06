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

  const ringClass = isActive
    ? "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px] rounded-full shadow-lg scale-105"
    : "border-2 border-border/40 rounded-full group-hover:border-primary/60 transition-all duration-300";

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group outline-none shrink-0 snap-start transition-transform active:scale-95"
    >
      <div className={`${sizeClasses[size]} ${ringClass} transition-all duration-300 ${!isActive && 'hover:scale-105'}`}>
        <div className="w-full h-full rounded-full overflow-hidden bg-muted/10 shadow-inner">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80';
            }}
          />
        </div>
      </div>
      <span className={`${textSize[size]} font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted/80 group-hover:text-primary'
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

  const scrollHoriz = (direction) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6; // Scrolls by 60% of the visible container
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  if (loading) return null;

  return (
    <section className="py-6 relative w-full max-w-7xl mx-auto">

      {/* UNIFIED SCROLL CONTAINER (Mobile & PC) */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-5 md:gap-8 px-6 md:px-10 pb-4 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden items-start"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map(cat => (
          <HighlightCircle
            key={cat.name}
            image={cat.image}
            name={cat.name}
            isActive={activeCategory === cat.name}
            onClick={() => cat.isCustom ? navigate('/custom-cake') : setActiveCategory(cat.name)}
            size="md"
          />
        ))}
      </div>

      {/* UNIFIED MINIMALIST NAVIGATION ROW (< SWIPE >) */}
      <div className="flex justify-center items-center gap-4 mt-2 mb-2">
        <button
          onClick={() => scrollHoriz('left')}
          className="p-2 text-muted-foreground/60 hover:text-primary transition-colors hover:scale-110 active:scale-95"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        <span className="text-[10px] md:text-[11px] font-black text-muted-foreground/50 tracking-[0.25em] uppercase select-none">
          SWIPE
        </span>

        <button
          onClick={() => scrollHoriz('right')}
          className="p-2 text-muted-foreground/60 hover:text-primary transition-colors hover:scale-110 active:scale-95"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Subtle Side Fade Effects for Desktop reading clarity */}
      <div className="hidden md:block absolute top-0 bottom-12 left-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="hidden md:block absolute top-0 bottom-12 right-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />

    </section>
  );
};