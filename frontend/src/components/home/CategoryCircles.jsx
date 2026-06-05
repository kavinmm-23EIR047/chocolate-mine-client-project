import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const CategoryCircles = ({ activeCategory, setActiveCategory }) => {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await api.get('/categories');
        const backendCategories = response.data?.data || [];
        const allCategory = {
          name: 'All',
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80'
        };
        setCategories([allCategory, ...backendCategories]);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([{
          name: 'All',
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80'
        }]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section className="py-4">
      {categoriesLoading ? (
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 px-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full bg-muted/10 animate-pulse" />
              <div className="w-14 h-3 bg-muted/10 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 lg:gap-14 px-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className="flex flex-col items-center gap-3 group outline-none shrink-0"
            >
              <div className={`w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-2 p-1.5 transition-all duration-500 overflow-hidden shadow-md ${activeCategory === cat.name
                ? 'border-primary ring-4 ring-primary/10 shadow-primary/20 scale-110'
                : 'border-border/30 group-hover:border-primary/40 group-hover:scale-105'
                }`}>
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80'; }}
                />
              </div>
              <span className={`text-[11px] sm:text-xs lg:text-sm font-bold uppercase tracking-[0.15em] transition-all duration-300 ${activeCategory === cat.name ? 'text-primary' : 'text-muted/70 group-hover:text-primary'
                }`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default CategoryCircles;
