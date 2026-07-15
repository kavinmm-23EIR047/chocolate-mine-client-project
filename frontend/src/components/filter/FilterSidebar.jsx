import React, { useState, useEffect, useCallback } from 'react';
import { Star, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
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
      setCategories(uniqueCategories);
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

  const handleCategoryToggle = useCallback((category, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const current = localFilters.categories || [];
    const updated = current.includes(category) 
      ? current.filter(c => c !== category) 
      : [...current, category];
    
    let newFilters = { ...localFilters, categories: updated };

    // Coordinate anniversary category with anniversary-gift occasion
    if (category.toLowerCase() === 'anniversary') {
      const currentOcc = localFilters.occasions || [];
      const updatedOcc = current.includes(category)
        ? currentOcc.filter(o => o !== 'anniversary-gift')
        : [...currentOcc.filter(o => o !== 'anniversary-gift'), 'anniversary-gift'];
      newFilters.occasions = updatedOcc;
    }

    // Coordinate birthday-cakes category with birthday-gifts occasion
    if (category.toLowerCase() === 'birthday-cakes' || category.toLowerCase() === 'birthday') {
      const currentOcc = localFilters.occasions || [];
      const updatedOcc = current.includes(category)
        ? currentOcc.filter(o => o !== 'birthday-gifts')
        : [...currentOcc.filter(o => o !== 'birthday-gifts'), 'birthday-gifts'];
      newFilters.occasions = updatedOcc;
    }

    setLocalFilters(newFilters);
    onApply(newFilters);
  }, [localFilters, onApply]);

  const handleOccasionToggle = useCallback((occasionId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const current = localFilters.occasions || [];
    const updated = current.includes(occasionId)
      ? current.filter(o => o !== occasionId)
      : [occasionId]; 
      
    let newFilters = { ...localFilters, occasions: updated };

    // Coordinate anniversary-gift occasion with anniversary category
    if (occasionId === 'anniversary-gift') {
      const currentCat = localFilters.categories || [];
      const updatedCat = current.includes(occasionId)
        ? currentCat.filter(c => c.toLowerCase() !== 'anniversary')
        : [...currentCat.filter(c => c.toLowerCase() !== 'anniversary'), 'anniversary'];
      newFilters.categories = updatedCat;
    }

    // Coordinate birthday-gifts occasion with birthday-cakes category
    if (occasionId === 'birthday-gifts') {
      const currentCat = localFilters.categories || [];
      const updatedCat = current.includes(occasionId)
        ? currentCat.filter(c => c.toLowerCase() !== 'birthday-cakes' && c.toLowerCase() !== 'birthday')
        : [...currentCat.filter(c => c.toLowerCase() !== 'birthday-cakes' && c.toLowerCase() !== 'birthday'), 'birthday-cakes'];
      newFilters.categories = updatedCat;
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

  const containerClasses = isMobileDrawer
    ? "w-full bg-[#1A0F0D] text-white h-full overflow-y-auto custom-scrollbar p-5"
    : "hidden lg:block w-[320px] bg-[#1A0F0D] text-white rounded-xl shadow-xl border border-white/5 h-fit sticky top-[100px] max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar p-6";

  const renderAccordionHeader = (id, label) => (
    <button 
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full py-4 px-4 text-left group"
    >
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90 group-hover:text-primary transition-colors">{label}</h3>
      {expanded[id] ? (
        <ChevronUp size={16} className="text-white/50 group-hover:text-primary transition-colors" />
      ) : (
        <ChevronDown size={16} className="text-white/50 group-hover:text-primary transition-colors" />
      )}
    </button>
  );

  return (
    <aside className={containerClasses}>
      {!isMobileDrawer && (
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <h2 className="text-xl font-black text-white tracking-tight">Filters</h2>
          <button onClick={() => onReset()} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <X size={14} className="text-white/60 hover:text-white" />
          </button>
        </div>
      )}

      <div className="space-y-2">
        {/* Search Section */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 mb-4">
          {renderAccordionHeader('search', 'Search Products')}
          <AnimatePresence>
            {expanded.search && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-4 overflow-hidden">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={localSearchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search for products..."
                    className="w-full pl-10 pr-4 py-3 text-sm bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white placeholder:text-white/30"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories Section */}
        {categories.length > 0 && (
          <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 mb-4">
            {renderAccordionHeader('categories', 'Categories')}
            <AnimatePresence>
              {expanded.categories && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-5 overflow-hidden">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={(e) => handleCategoryToggle('All', e)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                        !(localFilters.categories?.length) || localFilters.categories.includes('All')
                          ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent'
                          : 'bg-transparent border-white/20 text-white/80 hover:border-white/50'
                      }`}
                    >
                      All
                    </button>
                    {categories.filter(c => c !== 'All' && c.toLowerCase() !== 'all').map((category) => {
                      const isActive = (localFilters.categories || []).includes(category);
                      const isCustom = category.toLowerCase().includes('custom cakes');
                      return (
                        <button
                          key={category}
                          onClick={(e) => handleCategoryToggle(category, e)}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                            isCustom 
                              ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-white border-transparent shadow-lg shadow-pink-500/20'
                              : isActive 
                                ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent' 
                                : 'bg-transparent border-white/20 text-white/80 hover:border-white/50'
                          }`}
                        >
                          {category} {isCustom && '✨'}
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
        {localFilters.categories?.some(c => c.toLowerCase().includes('birthday cake')) && (
          <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 mb-4">
            {renderAccordionHeader('subcategories', 'Flavours')}
            <AnimatePresence>
              {expanded.subcategories && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-5 overflow-hidden">
                  <div className="flex flex-wrap gap-2">
                    {['Vanilla', 'Chocolate', 'Red Velvet'].map((flavor) => {
                      const isActive = localFilters.subCategory?.toLowerCase() === flavor.toLowerCase();
                      return (
                        <button
                          key={flavor}
                          onClick={(e) => {
                            if (e) {
                              e.preventDefault();
                              e.stopPropagation();
                            }
                            const newFilters = { 
                              ...localFilters, 
                              subCategory: isActive ? '' : flavor 
                            };
                            setLocalFilters(newFilters);
                            onApply(newFilters);
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                            isActive 
                              ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent' 
                              : 'bg-transparent border-white/20 text-white/80 hover:border-white/50'
                          }`}
                        >
                          {flavor}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Occasions Section */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 mb-4">
          {renderAccordionHeader('occasions', 'Occasions')}
          <AnimatePresence>
            {expanded.occasions && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-5 overflow-hidden">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={(e) => handleOccasionToggle('All', e)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      !(localFilters.occasions?.length) || localFilters.occasions.includes('All')
                        ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent w-[48%]'
                        : 'bg-transparent border-white/20 text-white/80 hover:border-white/50 w-[48%]'
                    }`}
                  >
                    <div className="text-left w-full">All</div>
                  </button>
                  {occasions.map((occ) => {
                    const isActive = (localFilters.occasions || []).includes(occ.id);
                    return (
                      <button
                        key={occ.id}
                        onClick={(e) => handleOccasionToggle(occ.id, e)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                          isActive 
                            ? 'bg-[#EBD1C6] text-[#2C1810] border-transparent w-[48%]' 
                            : 'bg-transparent border-white/20 text-white/80 hover:border-white/50 w-[48%]'
                        }`}
                      >
                        <div className="text-left w-full">{occ.label}</div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Min Rating Section */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 mb-4">
          {renderAccordionHeader('rating', 'Min. Rating')}
          <AnimatePresence>
            {expanded.rating && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-5 overflow-hidden">
                <div className="space-y-3">
                  {[4, 3, 2].map((rating) => {
                    const isActive = isRatingActive(rating);
                    return (
                      <div 
                        key={rating}
                        onClick={(e) => handleRatingToggle(rating, e)}
                        className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-all ${
                          isActive ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              className={i < rating ? "fill-amber-400 text-amber-400" : "text-white/20"} 
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

        {/* Price Section */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 mb-4">
          <button 
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full py-4 px-4 text-left group"
          >
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90 group-hover:text-primary transition-colors">
              Price — ₹{priceRange.min} - ₹{priceRange.max === 10000 ? '10,000+' : priceRange.max}
            </h3>
            {expanded.price ? <ChevronUp size={16} className="text-white/50" /> : <ChevronDown size={16} className="text-white/50" />}
          </button>
          
          <AnimatePresence>
            {expanded.price && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-5 overflow-hidden">
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3">
                    <label className="text-[10px] font-bold text-white/50 mb-1 block">Min</label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => handlePriceRangeChange('min', e.target.value, e)}
                      onBlur={handlePriceApply}
                      className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3">
                    <label className="text-[10px] font-bold text-white/50 mb-1 block">Max</label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => handlePriceRangeChange('max', e.target.value, e)}
                      onBlur={handlePriceApply}
                      className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="relative h-10 bg-black/40 rounded-full border border-white/10 flex items-center px-4">
                    <input 
                      type="range" 
                      min="0" max="5000" 
                      value={priceRange.min} 
                      onChange={(e) => handlePriceRangeChange('min', e.target.value, e)}
                      onMouseUp={handlePriceApply}
                      onTouchEnd={handlePriceApply}
                      className="w-full accent-[#EBD1C6]" 
                    />
                  </div>
                  <div className="relative h-10 bg-black/40 rounded-full border border-white/10 flex items-center px-4">
                    <input 
                      type="range" 
                      min="0" max="10000" 
                      value={priceRange.max} 
                      onChange={(e) => handlePriceRangeChange('max', e.target.value, e)}
                      onMouseUp={handlePriceApply}
                      onTouchEnd={handlePriceApply}
                      className="w-full accent-[#EBD1C6]" 
                    />
                  </div>
                </div>
                
                <div className="flex justify-between text-[10px] font-bold text-white/40 mt-4 px-1">
                  <span>₹10</span>
                  <span>₹10,000+</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort By Section */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 mb-4">
          {renderAccordionHeader('sort', 'Sort By')}
          <AnimatePresence>
            {expanded.sort && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-5 overflow-hidden">
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-black/40 border border-white/10 text-white font-bold text-sm py-3 px-4 rounded-xl focus:outline-none focus:border-primary"
                    value={localFilters.sort?.[0] || 'newest'}
                    onChange={handleSortChange}
                  >
                    <option value="newest">Newest First</option>
                    <option value="popular">Popularity</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Rating</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
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