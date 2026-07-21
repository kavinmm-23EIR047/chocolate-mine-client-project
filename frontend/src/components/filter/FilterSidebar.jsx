import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronDown, ChevronUp, Search, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FilterSidebar = ({ 
  activeFilters = {}, 
  onApply, 
  onReset,
  onSearch,
  searchTerm = '',
  products = [],
  categories: propCategories = [],
  isMobileDrawer = false
}) => {
  const navigate = useNavigate();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [priceRange, setPriceRange] = useState({ min: 10, max: 10000 });
  const [categories, setCategories] = useState(propCategories);
  const [localFilters, setLocalFilters] = useState(activeFilters);

  const [expanded, setExpanded] = useState({
    search: true,
    categories: true,
    subcategories: true,
    occasions: true,
    rating: true,
    price: true,
    sort: true
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Extract unique categories from products if not provided
  useEffect(() => {
    if (propCategories.length === 0 && products.length > 0) {
      const allCategories = products.flatMap(p => Array.isArray(p.category) ? p.category : [p.category]).filter(Boolean);
      const uniqueCategories = [...new Set(allCategories)];
      // Convert string categories to object shape { name, label }
      setCategories(uniqueCategories.map(c => typeof c === 'string' ? { name: c.toLowerCase(), label: c.replace(/-/g, ' ') } : c));
    } else {
      setCategories(propCategories);
    }
  }, [products, propCategories]);

  // Sync with parent filters
  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);

  // Sync search term
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Initialize price range from filters
  useEffect(() => {
    if (activeFilters.priceRange) {
      setPriceRange(activeFilters.priceRange);
    }
  }, [activeFilters.priceRange]);

  const occasions = [
    { id: 'anniversary-gift', label: 'Anniversary gift' },
    { id: 'birthday-gifts', label: 'Birthday gifts' },
    { id: 'gift-for-her', label: 'Gift for Her' },
    { id: 'gift-for-him', label: 'Gift for Him' },
  ];

  // Calculate active filter count for display
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (localFilters.categories?.length) {
      count += localFilters.categories.filter(c => c !== 'all' && c.toLowerCase() !== 'all').length;
    }
    if (localFilters.subCategory) count += 1;
    if (localFilters.occasions?.length && !localFilters.occasions.includes('all')) {
      count += localFilters.occasions.length;
    }
    if (localFilters.ratings?.length) count += localFilters.ratings.length;
    if (localFilters.priceRange && (localFilters.priceRange.min > 10 || localFilters.priceRange.max < 10000)) {
      count += 1;
    }
    if (localFilters.sort?.length && localFilters.sort[0] !== 'newest') count += 1;
    return count;
  }, [localFilters]);

  // Handle search with debounce
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      if (onSearch) {
        onSearch(value);
      }
    }, 300);
  }, [onSearch]);

  const handleCategoryToggle = useCallback((categoryName, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Check if clicked category is a Custom Cake category
    const catObj = categories.find(c => (c.name || '').toLowerCase() === (categoryName || '').toLowerCase());
    if (catObj && catObj.categoryType === 'custom') {
      navigate(`/custom-cake?category=${encodeURIComponent(categoryName)}`);
      return;
    }
    
    let newFilters = { ...localFilters };
    
    if (categoryName === 'all') {
      newFilters.categories = [];
      newFilters.occasions = []; // If Category All is clicked, clear occasion too
      newFilters.subCategory = '';
    } else {
      const current = localFilters.categories || [];
      const isAlreadyActive = current.includes(categoryName);
      
      const updated = isAlreadyActive 
        ? current.filter(c => c !== categoryName) 
        : [...current.filter(c => c !== 'all'), categoryName];
      
      newFilters.categories = updated;
    }

    setLocalFilters(newFilters);
    onApply(newFilters);
  }, [categories, localFilters, navigate, onApply]);

  const handleOccasionToggle = useCallback((occasionId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    let newFilters = { ...localFilters };
    
    if (occasionId === 'all') {
      newFilters.occasions = [];
      newFilters.categories = [];
      newFilters.subCategory = '';
    } else {
      const current = localFilters.occasions || [];
      const isAlreadyActive = current.includes(occasionId);
      
      const updated = isAlreadyActive
        ? current.filter(o => o !== occasionId)
        : [occasionId]; 
        
      newFilters.occasions = updated;
    }

    setLocalFilters(newFilters);
    onApply(newFilters);
  }, [localFilters, onApply]);

  const handlePriceRangeChange = useCallback((type, value, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const newRange = { ...priceRange, [type]: parseInt(value) || 0 };
    setPriceRange(newRange);
  }, [priceRange]);
  
  const handlePriceApply = useCallback(() => {
    const newFilters = { ...localFilters, priceRange };
    setLocalFilters(newFilters);
    onApply(newFilters);
  }, [priceRange, localFilters, onApply]);

  const handleRatingToggle = useCallback((rating, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const current = localFilters.ratings || [];
    const updated = current.includes(rating) 
      ? current.filter(r => r !== rating) 
      : [rating]; 
    
    const newFilters = { ...localFilters, ratings: updated };
    setLocalFilters(newFilters);
    onApply(newFilters);
  }, [localFilters, onApply]);

  const handleSortChange = useCallback((e) => {
    const value = e.target.value;
    const newFilters = { ...localFilters, sort: [value] };
    setLocalFilters(newFilters);
    onApply(newFilters);
  }, [localFilters, onApply]);

  const isRatingActive = useCallback((rating) => {
    return (localFilters.ratings || []).includes(rating);
  }, [localFilters.ratings]);

  const renderAccordionHeader = (id, label) => (
    <button 
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full py-4 px-4 text-left group"
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#A18881] group-hover:text-[#EBD1C6] transition-colors">{label}</h3>
      {expanded[id] ? (
        <ChevronUp size={16} className="text-[#A18881]/60 group-hover:text-[#EBD1C6] transition-colors" />
      ) : (
        <ChevronDown size={16} className="text-[#A18881]/60 group-hover:text-[#EBD1C6] transition-colors" />
      )}
    </button>
  );

  const containerClasses = isMobileDrawer
    ? "w-full bg-[#1A0E0B] text-[#ecded9] h-full overflow-y-auto custom-scrollbar p-6"
    : "hidden lg:block w-[360px] bg-[#1A0E0B] text-[#ecded9] rounded-2xl border border-[#3A211B] h-fit sticky top-[135px] p-6 shadow-lg shadow-black/20 shrink-0";

  return (
    <aside className={containerClasses}>
      {/* Sidebar Header (Only Desktop) */}
      {!isMobileDrawer && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#3A211B] select-none">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[#E6B25A]" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">Filters</h2>
          </div>
          
          {getActiveFilterCount() > 0 && (
            <button 
              onClick={onReset}
              className="flex items-center gap-1 text-xs font-bold text-[#E6B25A] hover:text-[#F0C46E] transition-colors"
            >
              <RotateCcw size={12} />
              Reset All
            </button>
          )}
        </div>
      )}

      {/* Main filters contents */}
      <div className="space-y-4">
        {/* Search Section */}
        <div className="border border-[#3A211B] rounded-xl overflow-hidden bg-white/[0.01] mb-4">
          {renderAccordionHeader('search', 'Search Products')}
          <AnimatePresence>
            {expanded.search && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-4 overflow-hidden">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={localSearchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search for products..."
                    className="w-full pl-10 pr-4 py-3 text-sm bg-black/30 border border-[#3A211B] rounded-lg focus:outline-none focus:border-[#E6B25A] text-white placeholder:text-white/20 transition-colors"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories Section */}
        {categories.length > 0 && (
          <div className="border border-[#3A211B] rounded-xl overflow-hidden bg-white/[0.01] mb-4">
            {renderAccordionHeader('categories', 'Categories')}
            <AnimatePresence>
              {expanded.categories && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-4 overflow-hidden">
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={(e) => handleCategoryToggle('all', e)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                        !(localFilters.categories?.length) || localFilters.categories.includes('all')
                          ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent'
                          : 'bg-[#2A1813] border-[#3A211B] text-white/70 hover:border-[#A18881]/50 hover:text-white'
                      }`}
                    >
                      All
                    </button>
                    {categories.filter(c => c.name !== 'all' && c.name !== 'All').map((category) => {
                      const categoryName = typeof category === 'string' ? category : category.name;
                      const categoryLabel = typeof category === 'string' ? category : category.label;
                      const isCustom = typeof category === 'object' && category.categoryType === 'custom';
                      const isActive = (localFilters.categories || []).includes(categoryName);
                      return (
                        <button
                          key={categoryName}
                          onClick={(e) => handleCategoryToggle(categoryName, e)}
                          className={`px-3.5 py-2 rounded-full text-xs font-black transition-all border flex items-center gap-1.5 ${
                            isCustom 
                              ? 'bg-gradient-to-r from-[#E6B25A]/20 via-[#F0C46E]/30 to-[#E6B25A]/20 border-[#E6B25A] text-[#E6B25A] hover:bg-[#E6B25A]/40 hover:text-white shadow-sm shadow-[#E6B25A]/20'
                              : isActive 
                                ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent' 
                                : 'bg-[#2A1813] border-[#3A211B] text-white/70 hover:border-[#A18881]/50 hover:text-white'
                          }`}
                        >
                          {isCustom && <Sparkles size={13} className="text-[#E6B25A] shrink-0" />}
                          <span>{categoryLabel}</span>
                          {isCustom && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#E6B25A]/25 text-[#E6B25A] border border-[#E6B25A]/40">
                              Custom
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sub Categories Section */}
        {(() => {
          const selectedCatObjs = categories.filter(c => {
            const name = typeof c === 'string' ? c : c.name;
            return (localFilters.categories || []).some(lc => lc.toLowerCase() === (name || '').toLowerCase());
          });
          const availableSubCats = [...new Set(selectedCatObjs.flatMap(c => c.subCategories || []))].filter(Boolean);

          if (availableSubCats.length === 0) return null;

          return (
            <div className="border border-[#3A211B] rounded-xl overflow-hidden bg-white/[0.01] mb-4">
              {renderAccordionHeader('subcategories', 'Subcategories')}
              <AnimatePresence>
                {expanded.subcategories && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-4 overflow-hidden">
                    <div className="flex flex-wrap gap-2.5">
                      {availableSubCats.map((subName) => {
                        const isActive = localFilters.subCategory?.toLowerCase() === subName.toLowerCase();
                        return (
                          <button
                            key={subName}
                            onClick={(e) => {
                              if (e) {
                                e.preventDefault();
                                e.stopPropagation();
                              }
                              const newFilters = { 
                                ...localFilters, 
                                subCategory: isActive ? '' : subName 
                              };
                              setLocalFilters(newFilters);
                              onApply(newFilters);
                            }}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border capitalize ${
                              isActive 
                                ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent' 
                                : 'bg-[#2A1813] border-[#3A211B] text-white/70 hover:border-[#A18881]/50 hover:text-white'
                            }`}
                          >
                            {subName}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

        {/* Occasions Section */}
        <div className="border border-[#3A211B] rounded-xl overflow-hidden bg-white/[0.01] mb-4">
          {renderAccordionHeader('occasions', 'Occasions')}
          <AnimatePresence>
            {expanded.occasions && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-4 overflow-hidden">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={(e) => handleOccasionToggle('all', e)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
                      !(localFilters.occasions?.length) || localFilters.occasions.includes('all')
                        ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent'
                        : 'bg-[#2A1813] border-[#3A211B] text-white/70 hover:border-[#A18881]/50 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  {occasions.map((occ) => {
                    const isActive = (localFilters.occasions || []).includes(occ.id);
                    return (
                      <button
                        key={occ.id}
                        onClick={(e) => handleOccasionToggle(occ.id, e)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
                          isActive 
                            ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent' 
                            : 'bg-[#2A1813] border-[#3A211B] text-white/70 hover:border-[#A18881]/50 hover:text-white'
                        }`}
                      >
                        {occ.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Min Rating Section */}
        <div className="border border-[#3A211B] rounded-xl overflow-hidden bg-white/[0.01] mb-4">
          {renderAccordionHeader('rating', 'Min. Rating')}
          <AnimatePresence>
            {expanded.rating && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-4 overflow-hidden">
                <div className="space-y-2.5">
                  {[4, 3, 2].map((rating) => {
                    const isActive = isRatingActive(rating);
                    return (
                      <div 
                        key={rating}
                        onClick={(e) => handleRatingToggle(rating, e)}
                        className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all border ${
                          isActive 
                            ? 'bg-white/[0.05] border-[#E6B25A]' 
                            : 'border-[#3A211B]/40 bg-transparent hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex gap-1.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={16} 
                              className={i < rating ? "fill-[#E6B25A] text-[#E6B25A]" : "text-white/10"} 
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-white/70">& up</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>



        {/* Sort By Section */}
        <div className="border border-[#3A211B] rounded-xl overflow-hidden bg-white/[0.01] mb-2">
          {renderAccordionHeader('sort', 'Sort By')}
          <AnimatePresence>
            {expanded.sort && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-4 overflow-hidden">
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-black/30 border border-[#3A211B] text-[#ecded9] font-bold text-sm py-3 pl-3.5 pr-8 rounded-lg focus:outline-none focus:border-[#E6B25A] cursor-pointer"
                    value={localFilters.sort?.[0] || 'newest'}
                    onChange={handleSortChange}
                  >
                    <option value="newest" className="bg-[#1A0E0B]">Newest First</option>
                    <option value="popular" className="bg-[#1A0E0B]">Popularity</option>
                    <option value="price-low" className="bg-[#1A0E0B]">Price: Low to High</option>
                    <option value="price-high" className="bg-[#1A0E0B]">Price: High to Low</option>
                    <option value="rating" className="bg-[#1A0E0B]">Rating</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;