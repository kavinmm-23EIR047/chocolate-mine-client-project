import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import api from '../../utils/api';

const MegaMenu = () => {
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, occRes] = await Promise.all([
          api.get('/categories').catch(() => ({ data: { data: [] } })),
          api.get('/occasions').catch(() => ({ data: { data: [] } }))
        ]);
        setCategories(catRes.data?.data || []);
        setOccasions(occRes.data?.data || []);
      } catch (error) {
        console.error('Mega menu fetch error', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1 text-sm font-black uppercase tracking-widest text-heading group-hover:text-primary transition-colors py-4">
        SHOP BY CATEGORY <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {/* Mega Menu Dropdown Container */}
      <div 
        className={`absolute top-full left-0 w-[600px] bg-card border border-border/20 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 origin-top-left z-[300] ${
          isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
        }`}
      >
        <div className="flex p-6 min-h-[300px]">
          
          {/* Categories Column */}
          <div className="flex-1 pr-6 border-r border-border/10">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4 border-b border-border/10 pb-2">Categories</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Link 
                to="/shop"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-heading/80 hover:text-primary uppercase tracking-normal transition-colors block whitespace-nowrap"
              >
                ALL
              </Link>
              {categories.map((cat) => (
                <Link 
                  key={cat._id} 
                  to={`/shop?category=${cat.name.toLowerCase()}`}
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-heading/80 hover:text-primary uppercase tracking-normal transition-colors block whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Occasions Column */}
          <div className="flex-1 pl-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4 border-b border-border/10 pb-2">Occasions</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Link 
                to="/shop"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-heading/80 hover:text-primary uppercase tracking-normal transition-colors block whitespace-nowrap"
              >
                ALL
              </Link>
              {occasions.map((occ) => {
                const slug = occ.name.toLowerCase().replace(/\s+/g, '-');
                return (
                  <Link 
                    key={occ._id} 
                    to={`/shop?occasion=${slug}`}
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-bold text-heading/80 hover:text-primary uppercase tracking-normal transition-colors block whitespace-nowrap"
                  >
                    {occ.name}
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
        
        {/* Bottom Quick Links Bar */}
        <div className="bg-primary/5 p-4 flex items-center justify-between border-t border-border/10">
          <Link to="/custom-cake" onClick={() => setIsOpen(false)} className="text-sm font-black text-heading uppercase tracking-widest hover:text-primary transition-colors">
            ✨ Custom Cakes Builder
          </Link>
          <Link to="/shop?bestseller=true" onClick={() => setIsOpen(false)} className="text-sm font-black text-heading uppercase tracking-widest hover:text-primary transition-colors">
            🔥 View Bestsellers
          </Link>
          <Link to="/shop?featured=true" onClick={() => setIsOpen(false)} className="text-sm font-black text-heading uppercase tracking-widest hover:text-primary transition-colors">
            ⭐ Featured Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;
