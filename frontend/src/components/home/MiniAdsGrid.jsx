import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';

const HighlightCircle = ({ image, name, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 group outline-none shrink-0 snap-start"
    >
      <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[2px] transition-all duration-300 ${isActive ? 'bg-gradient-to-tr from-amber-400 to-pink-600 scale-105' : 'bg-transparent'
        }`}>
        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80'; }}
          />
        </div>
      </div>
      <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
        }`}>
        {name}
      </span>
    </button>
  );
};

export const CategoryCircles = ({ activeCategory, setActiveCategory }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const mobileScrollRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get('/categories');
        const backend = response.data?.data || [];
        setCategories([{ name: 'All', image: '...' }, ...backend]);
      } catch (error) {
        setCategories([{ name: 'All', image: '...' }]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const scrollHoriz = (direction) => {
    if (!mobileScrollRef.current) return;
    const amount = mobileScrollRef.current.clientWidth * 0.6;
    mobileScrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (loading) return null;

  return (
    <section className="py-8 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4">
        {/* Scroll Area */}
        <div
          ref={mobileScrollRef}
          className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scroll-smooth no-scrollbar"
        >
          {categories.map((cat) => (
            <HighlightCircle
              key={cat.name}
              image={cat.image}
              name={cat.name}
              isActive={activeCategory === cat.name}
              onClick={() => setActiveCategory(cat.name)}
            />
          ))}
        </div>

        {/* Minimalist Navigation Row */}
        <div className="flex justify-center items-center gap-6 text-slate-400 dark:text-slate-500">
          <button onClick={() => scrollHoriz('left')} className="hover:text-amber-500 transition-colors">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          <span className="text-[10px] font-bold tracking-[0.2em] uppercase select-none">
            Swipe
          </span>

          <button onClick={() => scrollHoriz('right')} className="hover:text-amber-500 transition-colors">
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategoryCircles;