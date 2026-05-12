import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const CategorySlider = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);

        const response = await api.get('/categories');

        if (response.data?.data) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Category fetch failed:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-10">
        <div className="flex gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-24 h-24 rounded-full bg-muted/20 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-heading uppercase tracking-tighter">
            What's on your mind?
          </h2>
          <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">
            Explore our artisanal collection
          </p>
        </div>

        <div className="flex gap-2">
          <button className="p-2 bg-muted/5 border border-border/50 rounded-full">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <button className="p-2 bg-muted/5 border border-border/50 rounded-full">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-6 gap-6 sm:gap-10 no-scrollbar">
        {categories.map((cat, i) => (
          <motion.div
            key={cat._id || i}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex-shrink-0 cursor-pointer group"
            onClick={() => navigate(`/shop?category=${cat.name}`)}
          >
            <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full overflow-hidden border border-border/30 shadow-soft mb-4">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              />
            </div>

            <p className="text-center text-xs sm:text-sm font-black uppercase tracking-widest">
              {cat.name}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CategorySlider;