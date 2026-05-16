import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const CategoryStrip = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback categories if API fails
  const fallbackCategories = [
    { name: 'cakes', label: 'Cakes', emoji: '🎂' },
    { name: 'chocolates', label: 'Chocolates', emoji: '🍫' },
    { name: 'flowers', label: 'Flowers', emoji: '💐' },
    { name: 'gifts', label: 'Gifts', emoji: '🎁' },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get('/categories');
        if (response.data?.data && response.data.data.length > 0) {
          setCategories(response.data.data);
        } else {
          setCategories(fallbackCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="bg-card border-b border-border">
      <div className="max-w-[1800px] mx-auto px-4 py-3 sm:px-12 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-center gap-6 sm:gap-12">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted/20 rounded-xl animate-pulse" />
                <div className="w-10 h-2 bg-muted/20 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-[1800px] mx-auto px-4 py-3 sm:px-12 overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-center gap-6 sm:gap-12 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat.name || cat._id}
              onClick={() => navigate(`/?search=&category=${cat.name}`)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-background border border-border rounded-xl flex items-center justify-center text-2xl group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                {cat.emoji || '🍰'}
              </div>
              <span className="text-[11px] font-bold text-body group-hover:text-primary transition-colors">
                {cat.label || cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryStrip;