import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Layers, Sparkles } from 'lucide-react';
import api from '../../utils/api';

const CustomCakeMenu = () => {
  const [categories, setCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchCustomMeta = async () => {
      try {
        const catRes = await api.get('/categories', { params: { activeOnly: true, type: 'custom' } }).catch(() => ({ data: { data: [] } }));
        setCategories(catRes.data?.data || []);
      } catch (err) {
        console.error('CustomCakeMenu fetch error', err);
      }
    };
    fetchCustomMeta();
  }, []);

  const tiersList = [
    { id: 1, name: 'Single Tier (Tier 1)', shortName: '1 Tier', path: '/custom-cake?tier=1' },
    { id: 2, name: 'Two Tier (Tier 2)', shortName: '2 Tiers', path: '/custom-cake?tier=2' },
    { id: 3, name: 'Three Tier (Tier 3)', shortName: '3 Tiers', path: '/custom-cake?tier=3' },
  ];

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link 
        to="/custom-cake"
        className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-heading group-hover:text-primary transition-colors py-2"
      >
        CUSTOM CAKES <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </Link>

      {/* Dropdown Container */}
      <div 
        className={`absolute top-full left-0 w-[540px] bg-card border border-border/20 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 origin-top-left z-[300] ${
          isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
        }`}
      >
        <div className="flex p-5 gap-6 bg-[var(--card)]">
          {/* Categories Column */}
          <div className="flex-1 pr-4 border-r border-border/10">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-3 border-b border-border/10 pb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-primary" />
              Categories
            </h3>
            <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar">
              <Link 
                to="/custom-cake"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-heading/80 hover:text-primary uppercase tracking-normal transition-colors block py-1"
              >
                ALL CUSTOM CAKES
              </Link>
              {categories.map((cat) => (
                <Link 
                  key={cat._id} 
                  to={`/custom-cake?category=${encodeURIComponent((cat.name || '').toLowerCase())}`}
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-heading/80 hover:text-primary uppercase tracking-normal transition-colors block py-1"
                >
                  {cat.label || cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Tiers Column */}
          <div className="w-[200px]">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-3 border-b border-border/10 pb-2 flex items-center gap-1.5">
              <Layers size={13} className="text-primary" />
              Tiers
            </h3>
            <div className="space-y-2">
              {tiersList.map((tier) => (
                <Link 
                  key={tier.id} 
                  to={tier.path}
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-heading/80 hover:text-primary uppercase tracking-normal transition-colors block py-1.5 px-3 rounded-lg bg-border/10 hover:bg-primary/10 hover:text-primary transition-all"
                >
                  {tier.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomCakeMenu;
