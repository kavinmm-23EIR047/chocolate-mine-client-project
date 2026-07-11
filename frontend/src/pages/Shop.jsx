import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Search, X, Star, ChevronDown, ChevronUp, LayoutGrid, List
} from 'lucide-react';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useGetProductsQuery } from '../product/productApi';
import api from '../utils/api';
import ProductCard from '../product/ProductCard';
import { useDeliveryLocation } from '../context/LocationContext';
import FilterSidebar from '../components/filter/FilterSidebar';
import FilterDrawer from '../components/filter/FilterDrawer';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [mobileLayout, setMobileLayout] = useState('grid');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const filterTimeoutRef = useRef(null);

  // State for FilterSidebar and FilterDrawer
  const [activeFilters, setActiveFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Accordion state
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    occasions: true,
    rating: true,
    price: true,
    sort: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const { location } = useDeliveryLocation();

  // Get filter values from URL with proper defaults
  const activeCategory = searchParams.get('category') || 'all';
  const activeSubCategory = searchParams.get('subCategory') || '';
  const activeOccasion = searchParams.get('occasion') || 'all';
  const activeRating = Number(searchParams.get('rating')) || 0;
  const sortBy = searchParams.get('sort') || 'newest';
  const searchQuery = searchParams.get('search') || '';
  const isBestseller = searchParams.get('bestseller') === 'true';
  const isFeatured = searchParams.get('featured') === 'true';

  const [priceRange, setPriceRange] = useState([
    Number(searchParams.get('minPrice')) || 10,
    Number(searchParams.get('maxPrice')) || 10000,
  ]);

  // Sync local search term with URL param
  useEffect(() => {
    setLocalSearchTerm(searchQuery);
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  // Sync filters with URL params
  useEffect(() => {
    const filters = {};
    if (activeCategory !== 'all') filters.categories = [activeCategory];
    if (activeOccasion !== 'all') filters.occasions = [activeOccasion];
    if (activeRating > 0) filters.ratings = [activeRating];
    if (priceRange[0] > 10 || priceRange[1] < 10000) {
      filters.priceRange = { min: priceRange[0], max: priceRange[1] };
    }
    if (sortBy !== 'newest') filters.sort = [sortBy];
    setActiveFilters(filters);
  }, [activeCategory, activeOccasion, activeRating, priceRange, sortBy]);

  // CRITICAL FIX: Update search param with proper state management
  const updateSearchParam = useCallback((key, value) => {
    // Clear any pending timeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    // Use a small delay to prevent rapid re-renders
    filterTimeoutRef.current = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!value || value === 'all' || value === 0 || value === false || value === '') {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
        return next;
      }, { replace: true });
    }, 50);
  }, [setSearchParams]);

  // Handle search with debounce
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    setSearchTerm(value);
    
    // Clear existing timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Debounce search
    window.searchTimeout = setTimeout(() => {
      updateSearchParam('search', value);
    }, 400);
  }, [updateSearchParam]);

  const handleSearchClear = useCallback(() => {
    setLocalSearchTerm('');
    setSearchTerm('');
    updateSearchParam('search', '');
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
  }, [updateSearchParam]);

  // Handle search from FilterSidebar/FilterDrawer
  const handleFilterSearch = useCallback((term) => {
    setSearchTerm(term);
    setLocalSearchTerm(term);
    updateSearchParam('search', term);
  }, [updateSearchParam]);

  // Handle apply filters from FilterSidebar/FilterDrawer
  const handleApplyFilters = useCallback((filters) => {
    setActiveFilters(filters);
    
    // Update URL params based on filters
    if (filters.categories?.length) {
      updateSearchParam('category', filters.categories[0]);
    } else {
      updateSearchParam('category', 'all');
    }
    
    if (filters.occasions?.length) {
      updateSearchParam('occasion', filters.occasions[0]);
    } else {
      updateSearchParam('occasion', 'all');
    }
    
    if (filters.ratings?.length) {
      updateSearchParam('rating', filters.ratings[0]);
    } else {
      updateSearchParam('rating', 0);
    }
    
    if (filters.priceRange) {
      updateSearchParam('minPrice', filters.priceRange.min);
      updateSearchParam('maxPrice', filters.priceRange.max);
    } else {
      updateSearchParam('minPrice', 10);
      updateSearchParam('maxPrice', 10000);
    }
    
    if (filters.sort?.length) {
      updateSearchParam('sort', filters.sort[0]);
    } else {
      updateSearchParam('sort', 'newest');
    }
    
    // Close drawers
    setIsFilterOpen(false);
    setIsDesktopFilterOpen(false);
  }, [updateSearchParam]);

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    setActiveFilters({});
    setSearchTerm('');
    setLocalSearchTerm('');
    setPriceRange([10, 10000]);
    setSearchParams(new URLSearchParams(), { replace: true });
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    setIsFilterOpen(false);
    setIsDesktopFilterOpen(false);
  }, [setSearchParams]);

  // CRITICAL FIX: Handle category click with prevention of default behavior
  const handleCategoryClick = useCallback((e, categoryName) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsApplyingFilter(true);
    updateSearchParam('category', categoryName);
    updateSearchParam('subCategory', '');
    
    // Close mobile filter if open
    if (isFilterOpen) setIsFilterOpen(false);
    if (isDesktopFilterOpen) setIsDesktopFilterOpen(false);
    
    // Reset applying state after delay
    setTimeout(() => setIsApplyingFilter(false), 200);
  }, [updateSearchParam, isFilterOpen, isDesktopFilterOpen]);

  // CRITICAL FIX: Handle occasion click
  const handleOccasionClick = useCallback((e, occasionName) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsApplyingFilter(true);
    updateSearchParam('occasion', occasionName);
    if (isFilterOpen) setIsFilterOpen(false);
    setTimeout(() => setIsApplyingFilter(false), 200);
  }, [updateSearchParam, isFilterOpen]);

  // CRITICAL FIX: Handle rating click
  const handleRatingClick = useCallback((e, rating) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsApplyingFilter(true);
    const currentRating = Number(searchParams.get('rating')) || 0;
    updateSearchParam('rating', currentRating === rating ? 0 : rating);
    setTimeout(() => setIsApplyingFilter(false), 200);
  }, [updateSearchParam, searchParams]);

  // CRITICAL FIX: Handle sort change
  const handleSortChange = useCallback((e) => {
    e.preventDefault();
    const value = e.target.value;
    updateSearchParam('sort', value);
  }, [updateSearchParam]);

  useEffect(() => {
    setPriceRange([
      Number(searchParams.get('minPrice')) || 10,
      Number(searchParams.get('maxPrice')) || 10000,
    ]);
  }, [searchParams]);

  // Fetch categories and occasions
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesRes, occasionsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/occasions')
        ]);
        
        const dbCats = categoriesRes.data?.data || categoriesRes.data || [];
        setCategories([
          { name: 'all', label: 'All' },
          ...dbCats.filter(c => c.isActive !== false).map(c => ({
            name: c.name,
            label: c.label || c.name.replace(/-/g, ' '),
            subCategories: c.subCategories || [],
          })),
        ]);

        const dbOcc = occasionsRes.data?.data || occasionsRes.data || [];
        setOccasions([
          { name: 'all', label: 'All' },
          ...dbOcc.filter(o => o.isActive !== false).map(o => ({
            name: o.name,
            label: o.label || o.name.replace(/-/g, ' '),
          })),
        ]);
      } catch (error) {
        console.error('Error fetching filters:', error);
        // Fallback categories
        setCategories([
          { name: 'all', label: 'All' },
          { name: 'anniversary', label: 'Anniversary' },
          { name: 'birthday-cakes', label: 'Birthday Cakes' },
          { name: 'chocolates', label: 'Chocolates' },
          { name: 'desserts', label: 'Desserts' },
        ]);
        setOccasions([
          { name: 'all', label: 'All' },
          { name: 'birthday-gifts', label: 'Birthday Gifts' },
          { name: 'gift-for-him', label: 'Gift for Him' },
        ]);
      }
    };
    fetchFilters();
  }, []);

  // Fetch products with filters
  const { data: productRes, isLoading: loading } = useGetProductsQuery({ 
    page: 1, 
    limit: 2000,
    category: activeCategory !== 'all' ? activeCategory : undefined,
    subCategory: activeSubCategory || undefined,
    occasion: activeOccasion !== 'all' ? activeOccasion : undefined,
    rating: activeRating > 0 ? activeRating : undefined,
    minPrice: priceRange[0] > 10 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
  });

  const products = productRes?.data || [];

  // Filter products with all filters applied
  const filteredProducts = useMemo(() => {
    let products = productRes?.data ? [...productRes.data] : [];

    // Location Filtering
    if (location === 'pan india') {
      products = products.filter(p => 
        p.location?.toLowerCase() === 'pan-india' || 
        p.location?.toLowerCase() === 'pan india'
      );
    }

    // Category Filter
    if (activeCategory !== 'all') {
      products = products.filter(p => 
        p.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }
    
    // SubCategory Filter
    if (activeSubCategory) {
      products = products.filter(p => 
        p.subCategory?.toLowerCase() === activeSubCategory.toLowerCase() || 
        p.cakeType?.toLowerCase() === activeSubCategory.toLowerCase()
      );
    }
    
    // Occasion Filter
    if (activeOccasion !== 'all') {
      products = products.filter(p => 
        p.occasion?.some(o => o.toLowerCase() === activeOccasion.toLowerCase())
      );
    }
    
    // Rating Filter
    if (activeRating > 0) {
      products = products.filter(p => (p.ratingsAverage || 0) >= activeRating);
    }
    
    // Price Filter
    products = products.filter(p => {
      const price = p.finalPrice ?? p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Search Filter with relevance scoring
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const queryWords = q.split(/\s+/).filter(Boolean);
      
      // Filter products that match any search term
      products = products.filter(p => {
        const name = p.name?.toLowerCase() || '';
        const desc = p.description?.toLowerCase() || '';
        const category = p.category?.toLowerCase() || '';
        const tags = p.tags?.map(t => t.toLowerCase()).join(' ') || '';
        const searchableText = `${name} ${desc} ${category} ${tags}`;
        return queryWords.some(word => searchableText.includes(word));
      });
      
      // Sort by relevance with priority scoring
      products.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aDesc = (a.description || '').toLowerCase();
        const bDesc = (b.description || '').toLowerCase();
        
        const getScore = (nameStr, descStr) => {
          // Priority 1: Exact match (highest priority)
          if (nameStr === q) return 0;
          
          // Priority 2: Starts with search term
          if (nameStr.startsWith(q)) return 1;
          
          // Priority 3: Contains search term in the middle
          if (nameStr.includes(q) && !nameStr.endsWith(q)) return 2;
          
          // Priority 4: Ends with search term
          if (nameStr.endsWith(q)) return 3;
          
          // Priority 5-7: Matches individual words
          for (const word of queryWords) {
            if (nameStr.startsWith(word)) return 4;
            if (nameStr.includes(word)) return 5;
            if (descStr.includes(word)) return 6;
          }
          
          return 7;
        };
        
        const scoreA = getScore(aName, aDesc);
        const scoreB = getScore(bName, bDesc);
        
        return scoreA - scoreB;
      });
    }

    // Apply sorting
    if (!searchQuery || sortBy !== 'newest') {
      const sorted = [...products];
      if (sortBy === 'price-low') {
        sorted.sort((a, b) => (a.finalPrice ?? a.price) - (b.finalPrice ?? b.price));
      } else if (sortBy === 'price-high') {
        sorted.sort((a, b) => (b.finalPrice ?? b.price) - (a.finalPrice ?? a.price));
      } else if (sortBy === 'rating') {
        sorted.sort((a, b) => (b.ratingsAverage || 0) - (a.ratingsAverage || 0));
      } else if (sortBy === 'newest') {
        sorted.sort((a, b) => {
          const da = a.createdAt?.$date ? new Date(a.createdAt.$date) : new Date(a.createdAt || 0);
          const db = b.createdAt?.$date ? new Date(b.createdAt.$date) : new Date(b.createdAt || 0);
          return db - da;
        });
      }
      products = sorted;
    }
    
    // Bestseller and Featured filters
    if (isBestseller) products = products.filter(p => p.bestseller === true);
    if (isFeatured) products = products.filter(p => p.featured === true);

    return products;
  }, [
    productRes?.data, 
    activeCategory, 
    activeSubCategory, 
    activeOccasion, 
    activeRating, 
    priceRange, 
    searchQuery, 
    isBestseller, 
    isFeatured, 
    sortBy, 
    location
  ]);

  const clearFilters = useCallback(() => {
    setIsApplyingFilter(true);
    setSearchParams(new URLSearchParams(), { replace: true });
    setPriceRange([10, 10000]);
    setLocalSearchTerm('');
    setSearchTerm('');
    setActiveFilters({});
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    setIsFilterOpen(false);
    setIsDesktopFilterOpen(false);
    setTimeout(() => setIsApplyingFilter(false), 200);
  }, [setSearchParams]);

  // Get active filter count for badge
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (activeCategory !== 'all') count += 1;
    if (activeSubCategory) count += 1;
    if (activeOccasion !== 'all') count += 1;
    if (activeRating > 0) count += 1;
    if (priceRange[0] > 10 || priceRange[1] < 10000) count += 1;
    if (sortBy !== 'newest') count += 1;
    if (isBestseller) count += 1;
    if (isFeatured) count += 1;
    return count;
  }, [activeCategory, activeSubCategory, activeOccasion, activeRating, priceRange, sortBy, isBestseller, isFeatured]);

  const getPageTitle = () => {
    if (isBestseller) return 'Best Sellers';
    if (isFeatured) return 'Featured Delights';
    if (searchQuery) return `"${searchQuery}"`;
    if (activeCategory !== 'all') {
      const sel = categories.find(c => c.name === activeCategory);
      return sel ? sel.label : activeCategory;
    }
    return 'The Shop';
  };

  // Filter Panel Component with proper event handlers
  const FilterPanel = () => (
    <div className="space-y-4">
      {/* Search Section */}
      <SectionCard
        title="Search Products"
        expanded={expandedSections.search !== false}
        onToggle={() => toggleSection('search')}
      >
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input 
            type="text" 
            placeholder="Search for products..." 
            value={localSearchTerm}
            onChange={handleSearchChange}
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg py-2.5 pl-9 pr-9 text-sm font-medium focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
          />
          {localSearchTerm && (
            <button 
              onClick={handleSearchClear} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--heading)]"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {localSearchTerm && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Showing results for: <span className="font-bold text-[var(--heading)]">"{localSearchTerm}"</span>
          </p>
        )}
      </SectionCard>

      {/* Categories */}
      <SectionCard
        title="Categories"
        expanded={expandedSections.categories}
        onToggle={() => toggleSection('categories')}
      >
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button 
              key={cat.name} 
              onClick={(e) => handleCategoryClick(e, cat.name)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                activeCategory === cat.name
                  ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                  : 'bg-[var(--heading)]/5 text-[var(--heading)]/80 border border-[var(--heading)]/10 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <Link to="/custom-cake"
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-md hover:scale-105 flex items-center gap-1 transition-all"
          >
            Custom Cakes ✨
          </Link>
        </div>
      </SectionCard>

      {/* Occasions */}
      {occasions.length > 1 && (
        <SectionCard
          title="Occasions"
          expanded={expandedSections.occasions}
          onToggle={() => toggleSection('occasions')}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {occasions.map((occ) => (
              <button 
                key={occ.name} 
                onClick={(e) => handleOccasionClick(e, occ.name)}
                className={`px-2 py-2 rounded-lg text-[11px] font-bold text-left transition-all ${
                  activeOccasion === occ.name
                    ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                    : 'bg-[var(--heading)]/5 text-[var(--heading)]/80 border border-[var(--heading)]/10 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
                }`}
              >
                {occ.label}
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Rating */}
      <SectionCard
        title="Min. Rating"
        expanded={expandedSections.rating}
        onToggle={() => toggleSection('rating')}
      >
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <button 
              key={r} 
              onClick={(e) => handleRatingClick(e, r)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                activeRating === r
                  ? 'bg-[var(--secondary)]/15 text-[var(--secondary)] border border-[var(--secondary)]/30'
                  : 'text-[var(--heading)]/70 hover:bg-[var(--heading)]/5 hover:text-[var(--heading)]'
              }`}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={12} 
                    className={i < r ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-[var(--heading)]/30'} 
                  />
                ))}
              </div>
              <span className="text-[11px] font-bold">&amp; up</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Price Range */}
      <SectionCard
        title={`Price — ₹${priceRange[0].toLocaleString()} – ₹${priceRange[1].toLocaleString()}`}
        expanded={expandedSections.price}
        onToggle={() => toggleSection('price')}
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-[var(--heading)]/60 mb-1 block">Min</label>
              <input 
                type="number" 
                value={priceRange[0]} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 0 && val <= priceRange[1]) {
                    setPriceRange([val, priceRange[1]]);
                  }
                }}
                onBlur={() => {
                  updateSearchParam('minPrice', priceRange[0]);
                  updateSearchParam('maxPrice', priceRange[1]);
                }}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-medium focus:ring-1 focus:ring-[var(--primary)] outline-none"
                min="0"
                max={priceRange[1]}
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-[var(--heading)]/60 mb-1 block">Max</label>
              <input 
                type="number" 
                value={priceRange[1]} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= priceRange[0] && val <= 10000) {
                    setPriceRange([priceRange[0], val]);
                  }
                }}
                onBlur={() => {
                  updateSearchParam('minPrice', priceRange[0]);
                  updateSearchParam('maxPrice', priceRange[1]);
                }}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-medium focus:ring-1 focus:ring-[var(--primary)] outline-none"
                min={priceRange[0]}
                max="10000"
              />
            </div>
          </div>
          <div>
            <input 
              type="range" 
              min={10} 
              max={10000} 
              step={50} 
              value={priceRange[0]}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val <= priceRange[1]) {
                  setPriceRange([val, priceRange[1]]);
                }
              }}
              onMouseUp={() => {
                updateSearchParam('minPrice', priceRange[0]);
                updateSearchParam('maxPrice', priceRange[1]);
              }}
              onTouchEnd={() => {
                updateSearchParam('minPrice', priceRange[0]);
                updateSearchParam('maxPrice', priceRange[1]);
              }}
              className="w-full h-1.5 bg-[var(--border)] rounded-full appearance-none accent-[var(--primary)] cursor-pointer" 
            />
          </div>
          <div>
            <input 
              type="range" 
              min={10} 
              max={10000} 
              step={50} 
              value={priceRange[1]}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= priceRange[0]) {
                  setPriceRange([priceRange[0], val]);
                }
              }}
              onMouseUp={() => {
                updateSearchParam('minPrice', priceRange[0]);
                updateSearchParam('maxPrice', priceRange[1]);
              }}
              onTouchEnd={() => {
                updateSearchParam('minPrice', priceRange[0]);
                updateSearchParam('maxPrice', priceRange[1]);
              }}
              className="w-full h-1.5 bg-[var(--border)] rounded-full appearance-none accent-[var(--primary)] cursor-pointer" 
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-[var(--muted)]">
            <span>₹10</span>
            <span>₹10,000+</span>
          </div>
        </div>
      </SectionCard>

      {/* Sort By */}
      <SectionCard
        title="Sort By"
        expanded={expandedSections.sort}
        onToggle={() => toggleSection('sort')}
      >
        <select 
          value={sortBy} 
          onChange={handleSortChange}
          className="w-full bg-[var(--heading)]/5 border border-[var(--heading)]/10 text-[var(--heading)] rounded-lg p-2.5 text-[12px] font-bold outline-none cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </SectionCard>

      <button 
        onClick={clearFilters}
        className="w-full py-3 border border-dashed border-[var(--heading)]/20 rounded-lg text-[12px] font-bold text-[var(--heading)]/80 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
      >
        Reset All Filters
      </button>
    </div>
  );

  // SectionCard component
  const SectionCard = ({ title, expanded, onToggle, children }) => (
    <div className="bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3.5 bg-[var(--heading)]/5 hover:bg-[var(--heading)]/10 transition-colors border-b border-[var(--border)]"
      >
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/80">
          {title}
        </h3>
        {expanded ? (
          <ChevronUp size={18} className="text-[var(--heading)]/60" />
        ) : (
          <ChevronDown size={18} className="text-[var(--heading)]/60" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3.5 pb-3.5 pt-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Mobile Top Bar
  const MobileTopBar = () => (
    <div className="sm:hidden mb-4 flex flex-col gap-3">
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input 
          type="text" 
          placeholder="Search products..." 
          value={localSearchTerm}
          onChange={handleSearchChange}
          className="w-full bg-[var(--card)] border border-[var(--border)] text-[var(--heading)] rounded-lg py-2.5 pl-10 pr-9 text-sm font-medium focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
        />
        {localSearchTerm && (
          <button 
            onClick={handleSearchClear} 
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--heading)]"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setIsFilterOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[12px] font-bold text-[var(--heading)] hover:border-[var(--primary)] transition-colors"
        >
          <SlidersHorizontal size={14} /> Filter
        </button>

        <div className="relative flex-1">
          <select 
            value={sortBy} 
            onChange={handleSortChange}
            className="w-full appearance-none bg-[var(--card)] border border-[var(--border)] text-[var(--heading)] rounded-lg pl-3 pr-7 py-2.5 text-[12px] font-bold outline-none cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price ↑</option>
            <option value="price-high">Price ↓</option>
            <option value="rating">Top Rated</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
        </div>

        <div className="flex items-center bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden shrink-0 h-[42px]">
          <button onClick={() => setMobileLayout('list')}
            className={`h-full px-3 transition-colors ${
              mobileLayout === 'list' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[var(--heading)]'
            }`}
          >
            <List size={16} />
          </button>
          <button onClick={() => setMobileLayout('grid')}
            className={`h-full px-3 transition-colors ${
              mobileLayout === 'grid' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[var(--heading)]'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button 
            key={cat.name} 
            onClick={(e) => handleCategoryClick(e, cat.name)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.name
                ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--heading)]/80 hover:border-[var(--primary)]/40'
            }`}
          >
            {cat.label}
          </button>
        ))}
        <Link to="/custom-cake"
          className="shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap bg-gradient-to-r from-amber-400 to-pink-500 text-white"
        >
          Custom ✨
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] pt-8 sm:pt-12 lg:pt-16 pb-24">
      <div className="responsive-container">
        {/* Desktop Header */}
        <div className="hidden sm:block relative mb-8 overflow-hidden rounded-2xl bg-[var(--footer)] p-6 sm:p-10 border border-white/5 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/8 via-transparent to-[var(--accent)]/8 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <nav className="flex items-center gap-2 mb-2">
                <Link to="/" className="text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-[var(--primary)] transition-colors">Home</Link>
                <span className="text-white/40">/</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">{getPageTitle()}</span>
              </nav>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">{getPageTitle()}</h1>
              <p className="text-sm text-white/80 font-medium max-w-md">Premium handcrafted confectionery, customized with passion and delivered fresh to your door.</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72 group">
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={localSearchTerm}
                    onChange={handleSearchChange}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-12 pr-10 text-sm font-medium focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all backdrop-blur-md placeholder:text-white/40"
                  />
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
                  {localSearchTerm && (
                    <button 
                      onClick={handleSearchClear} 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setIsDesktopFilterOpen(true)}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
                >
                  <SlidersHorizontal size={16} /> Filters
                  {getActiveFilterCount() > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-white/20 text-xs rounded-full">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </button>
              </div>
              <span className="text-[11px] font-bold text-white/80 bg-white/5 px-4 py-1.5 rounded-lg border border-white/10">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Title */}
        <div className="sm:hidden flex items-start justify-between gap-3 mb-3 pt-1">
          <div className="min-w-0">
            <h1 className="text-xl font-black text-[var(--heading)] leading-none">{getPageTitle()}</h1>
            <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">Discover our artisan cakes made with love.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[var(--muted)] shrink-0">
              {filteredProducts.length} items
            </span>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--primary)] text-[var(--button-text)] rounded-lg text-xs font-bold"
            >
              <SlidersHorizontal size={12} />
              Filters
              {getActiveFilterCount() > 0 && (
                <span className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Active Filters:</span>
            
            {activeCategory !== 'all' && (
              <span className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-[10px] font-bold flex items-center gap-1">
                Category: {categories.find(c => c.name === activeCategory)?.label || activeCategory}
                <button 
                  onClick={(e) => handleCategoryClick(e, 'all')}
                  className="hover:text-[var(--primary)]/70"
                >
                  ×
                </button>
              </span>
            )}
            
            {activeSubCategory && (
              <span className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-[10px] font-bold flex items-center gap-1">
                {activeSubCategory.replace(/-/g, ' ')}
                <button 
                  onClick={() => updateSearchParam('subCategory', '')}
                  className="hover:text-blue-600/70"
                >
                  ×
                </button>
              </span>
            )}
            
            {activeOccasion !== 'all' && (
              <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[10px] font-bold flex items-center gap-1">
                {occasions.find(o => o.name === activeOccasion)?.label || activeOccasion}
                <button 
                  onClick={(e) => handleOccasionClick(e, 'all')}
                  className="hover:text-secondary/70"
                >
                  ×
                </button>
              </span>
            )}
            
            {activeRating > 0 && (
              <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-[10px] font-bold flex items-center gap-1">
                {activeRating}★ & up
                <button 
                  onClick={(e) => handleRatingClick(e, activeRating)}
                  className="hover:text-yellow-600/70"
                >
                  ×
                </button>
              </span>
            )}
            
            {(priceRange[0] > 10 || priceRange[1] < 10000) && (
              <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[10px] font-bold flex items-center gap-1">
                ₹{priceRange[0]} - ₹{priceRange[1]}
                <button 
                  onClick={() => {
                    setPriceRange([10, 10000]);
                    updateSearchParam('minPrice', 10);
                    updateSearchParam('maxPrice', 10000);
                  }}
                  className="hover:text-green-600/70"
                >
                  ×
                </button>
              </span>
            )}
            
            {sortBy !== 'newest' && (
              <span className="px-3 py-1 bg-purple-500/10 text-purple-600 rounded-full text-[10px] font-bold flex items-center gap-1">
                Sort: {sortBy.replace('-', ' ')}
                <button 
                  onClick={() => updateSearchParam('sort', 'newest')}
                  className="hover:text-purple-600/70"
                >
                  ×
                </button>
              </span>
            )}
            
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-[10px] font-bold text-[var(--muted)] hover:text-[var(--heading)] transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main Content with Sidebar */}
        <div className="flex gap-6">
          {/* Desktop Filter Sidebar */}
          <FilterSidebar
            activeFilters={activeFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            onSearch={handleFilterSearch}
            searchTerm={searchTerm}
            products={products}
            categories={categories.map(c => c.label)}
          />

          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
                {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                {/* Mobile View */}
                <div className="sm:hidden">
                  {mobileLayout === 'list' ? (
                    <div className="flex flex-col gap-1.5">
                      {filteredProducts.map((product, i) => (
                        <motion.div key={product._id?.$oid || product._id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                        >
                          <ProductCard product={product} layout="horizontal" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {filteredProducts.map((product, i) => (
                        <motion.div key={product._id?.$oid || product._id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                        >
                          <ProductCard product={product} layout="vertical" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
                  {filteredProducts.map((product, i) => (
                    <motion.div key={product._id?.$oid || product._id}
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    >
                      <ProductCard product={product} layout="vertical" />
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="No products found"
                message="Try adjusting your filters or search terms."
                action={<button onClick={clearFilters} className="neo-btn text-sm">Clear All Filters</button>}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={activeFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onSearch={handleFilterSearch}
        searchTerm={searchTerm}
        products={products}
      />

      {/* Desktop Filter Drawer */}
      <AnimatePresence>
        {isDesktopFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDesktopFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="fixed left-0 top-0 bottom-0 w-full sm:w-[85%] max-w-sm bg-[var(--card)] z-[210] p-5 overflow-y-auto shadow-2xl border-r border-[var(--border)]"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-bold text-[var(--heading)]">Filters</h2>
                <button onClick={() => setIsDesktopFilterOpen(false)} className="p-2 bg-[var(--card-soft)] rounded-full text-[var(--muted)] hover:text-[var(--heading)] transition-colors">
                  <X size={18} />
                </button>
              </div>
              <FilterPanel />
              <button onClick={() => setIsDesktopFilterOpen(false)}
                className="w-full mt-6 py-3.5 bg-[var(--primary)] text-[var(--button-text)] rounded-lg text-[13px] font-bold shadow-md"
              >
                Apply Filters
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;