import React, { useState, useEffect, useCallback } from 'react';
import { Star, Check, RotateCcw, Search, X } from 'lucide-react';

const FilterSidebar = ({ 
  activeFilters = {}, 
  onApply, 
  onReset,
  onSearch,
  searchTerm = '',
  products = [],
  categories: propCategories = []
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [categories, setCategories] = useState(propCategories);
  const [localFilters, setLocalFilters] = useState(activeFilters);

  // Extract unique categories from products if not provided
  useEffect(() => {
    if (propCategories.length === 0 && products.length > 0) {
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
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

  const sections = [
    {
      id: 'sort',
      label: 'Sort By',
      options: [
        { value: 'popular', label: 'Popularity' },
        { value: 'price_low', label: 'Price: Low to High' },
        { value: 'price_high', label: 'Price: High to Low' },
        { value: 'rating', label: 'Rating' },
      ]
    },
    {
      id: 'dietary',
      label: 'Dietary',
      options: [
        { value: 'veg', label: 'Pure Veg' },
        { value: 'eggless', label: 'Eggless' },
      ]
    }
  ];

  // Handle toggle with prevent default
  const handleToggle = useCallback((sectionId, value, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const current = localFilters[sectionId] || [];
    const updated = current.includes(value) 
      ? current.filter(v => v !== value) 
      : [...current, value];
    
    const newFilters = { ...localFilters, [sectionId]: updated };
    setLocalFilters(newFilters);
    onApply(newFilters);
  }, [localFilters, onApply]);

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

  const handleSearchClear = useCallback(() => {
    setLocalSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
    clearTimeout(window.searchTimeout);
  }, [onSearch]);

  // Handle category toggle with prevent default
  const handleCategoryToggle = useCallback((category, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const current = localFilters.categories || [];
    const updated = current.includes(category) 
      ? current.filter(c => c !== category) 
      : [...current, category];
    
    const newFilters = { ...localFilters, categories: updated };
    setLocalFilters(newFilters);
    onApply(newFilters);
  }, [localFilters, onApply]);

  // Handle price range change
  const handlePriceRangeChange = useCallback((type, value, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const newRange = { ...priceRange, [type]: parseInt(value) || 0 };
    setPriceRange(newRange);
    const newFilters = { ...localFilters, priceRange: newRange };
    setLocalFilters(newFilters);
    onApply(newFilters);
  }, [priceRange, localFilters, onApply]);

  // Handle rating toggle with prevent default
  const handleRatingToggle = useCallback((rating, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const current = localFilters.ratings || [];
    const updated = current.includes(rating) 
      ? current.filter(r => r !== rating) 
      : [...current, rating];
    
    const newFilters = { ...localFilters, ratings: updated };
    setLocalFilters(newFilters);
    onApply(newFilters);
  }, [localFilters, onApply]);

  const isRatingActive = useCallback((rating) => {
    return (localFilters.ratings || []).includes(rating);
  }, [localFilters.ratings]);

  // Handle reset with prevent default
  const handleReset = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLocalFilters({});
    setPriceRange({ min: 0, max: 5000 });
    setLocalSearchTerm('');
    if (onSearch) onSearch('');
    onReset();
  }, [onSearch, onReset]);

  return (
    <aside className="hidden lg:block w-72 bg-white dark:bg-card rounded-sm shadow-sm border border-border/10 h-fit sticky top-[100px] max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="p-4 border-b border-border/30 flex items-center justify-between">
        <h2 className="text-base font-black text-heading uppercase tracking-tighter">Filters</h2>
        <button 
          onClick={handleReset}
          className="text-[10px] font-black text-primary hover:text-secondary uppercase tracking-widest flex items-center gap-1"
        >
          <RotateCcw size={12} /> Clear All
        </button>
      </div>

      {/* Search Section */}
      <div className="p-4 border-b border-border/30">
        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3">Search Products</h3>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={localSearchTerm}
            onChange={handleSearchChange}
            placeholder="Search for products..."
            className="w-full pl-9 pr-9 py-2 text-sm border border-border/50 rounded-md focus:outline-none focus:border-primary bg-white dark:bg-card"
          />
          {localSearchTerm && (
            <button
              onClick={handleSearchClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {localSearchTerm && (
          <p className="mt-2 text-xs text-muted">
            Showing results for: <span className="font-bold text-heading">"{localSearchTerm}"</span>
          </p>
        )}
      </div>

      <div className="divide-y divide-border/30">
        {/* Categories Section - Dynamic */}
        {categories.length > 0 && (
          <div className="p-4 py-6">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">Categories</h3>
            <div className="space-y-3">
              {categories.map((category) => {
                const isActive = (localFilters.categories || []).includes(category);
                return (
                  <label key={category} className="flex items-center gap-3 cursor-pointer group">
                    <div 
                      onClick={(e) => handleCategoryToggle(category, e)}
                      className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-all cursor-pointer ${
                        isActive ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/50'
                      }`}
                    >
                      {isActive && <Check size={12} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-tight transition-colors ${
                      isActive ? 'text-primary' : 'text-heading/70 group-hover:text-heading'
                    }`}>
                      {category}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Price Range Section */}
        <div className="p-4 py-6">
          <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">Price Range</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Min</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => handlePriceRangeChange('min', e.target.value, e)}
                  className="w-full mt-1 px-2 py-1 text-sm border border-border/50 rounded-md focus:outline-none focus:border-primary"
                  min="0"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Max</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => handlePriceRangeChange('max', e.target.value, e)}
                  className="w-full mt-1 px-2 py-1 text-sm border border-border/50 rounded-md focus:outline-none focus:border-primary"
                  min="0"
                />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="5000"
              value={priceRange.max}
              onChange={(e) => handlePriceRangeChange('max', e.target.value, e)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>₹0</span>
              <span>₹5000+</span>
            </div>
          </div>
        </div>

        {/* Filter Sections */}
        {sections.map((section) => (
          <div key={section.id} className="p-4 py-6">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">{section.label}</h3>
            <div className="space-y-3">
              {section.options.map((opt) => {
                const isActive = localFilters[section.id]?.includes(opt.value);
                return (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                    <div 
                      onClick={(e) => handleToggle(section.id, opt.value, e)}
                      className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-all cursor-pointer ${
                        isActive ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/50'
                      }`}
                    >
                      {isActive && <Check size={12} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-tight transition-colors ${
                      isActive ? 'text-primary' : 'text-heading/70 group-hover:text-heading'
                    }`}>
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {/* Rating Filter Special */}
        <div className="p-4 py-6">
          <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">Customer Ratings</h3>
          <div className="space-y-3">
            {[4, 3, 2].map((rating) => (
              <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={(e) => handleRatingToggle(rating, e)}
                  className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-all cursor-pointer ${
                    isRatingActive(rating) ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/50'
                  }`}
                >
                  {isRatingActive(rating) && <Check size={12} className="text-white" strokeWidth={4} />}
                </div>
                <span className={`text-xs font-bold transition-colors ${
                  isRatingActive(rating) ? 'text-primary' : 'text-heading/70 group-hover:text-heading'
                }`}>
                  {rating}★ & above
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;