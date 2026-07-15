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

const getBaseFilterWord = (term) => {
  const lower = term.toLowerCase();
  if (lower.includes('anniversary')) return 'anniversary';
  if (lower.includes('birthday')) return 'birthday';
  return lower.replace(/[\s-]/g, '');
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
  const rawCategories = searchParams.get('category') && searchParams.get('category') !== 'all' 
    ? searchParams.get('category').split(',').map(c => c.trim()).filter(Boolean) 
    : [];
  const rawOccasion = searchParams.get('occasion') || 'all';

  const hasAnniversaryCat = rawCategories.some(c => c.toLowerCase() === 'anniversary' || c.toLowerCase() === 'anniversary-gift');
  const hasAnniversaryOcc = rawOccasion.toLowerCase() === 'anniversary' || rawOccasion.toLowerCase() === 'anniversary-gift';

  const hasBirthdayCat = rawCategories.some(c => c.toLowerCase() === 'birthday' || c.toLowerCase() === 'birthday-cakes');
  const hasBirthdayOcc = rawOccasion.toLowerCase() === 'birthday' || rawOccasion.toLowerCase() === 'birthday-gifts';

  let activeCategories = [...rawCategories];
  if (hasAnniversaryCat || hasAnniversaryOcc) {
    if (!activeCategories.includes('anniversary')) activeCategories.push('anniversary');
  }
  if (hasBirthdayCat || hasBirthdayOcc) {
    if (!activeCategories.includes('birthday-cakes')) activeCategories.push('birthday-cakes');
  }

  let activeOccasion = rawOccasion;
  if (hasAnniversaryCat || hasAnniversaryOcc) {
    activeOccasion = 'anniversary-gift';
  } else if (hasBirthdayCat || hasBirthdayOcc) {
    activeOccasion = 'birthday-gifts';
  }
  const activeSubCategory = searchParams.get('subCategory') || '';
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
    if (activeCategories.length > 0) filters.categories = activeCategories;
    if (activeSubCategory) filters.subCategory = activeSubCategory;
    if (activeOccasion !== 'all') filters.occasions = [activeOccasion];
    if (activeRating > 0) filters.ratings = [activeRating];
    if (priceRange[0] > 10 || priceRange[1] < 10000) {
      filters.priceRange = { min: priceRange[0], max: priceRange[1] };
    }
    if (sortBy !== 'newest') filters.sort = [sortBy];
    setActiveFilters(filters);
  }, [JSON.stringify(activeCategories), activeOccasion, activeRating, priceRange, sortBy]);

  // CRITICAL FIX: Update search param with proper state management
  const updateSearchParam = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === 'all' || value === 0 || value === false || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const updateMultipleSearchParams = useCallback((updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === 'all' || value === 0 || value === false || value === '') {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      return next;
    }, { replace: true });
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
    
    const updates = {};
    
    // Update URL params based on filters
    if (filters.categories?.length) {
      updates.category = filters.categories.join(',');
    } else {
      updates.category = 'all';
    }
    
    if (filters.subCategory) {
      updates.subCategory = filters.subCategory;
    } else {
      updates.subCategory = '';
    }
    
    if (filters.occasions?.length) {
      updates.occasion = filters.occasions[0];
    } else {
      updates.occasion = 'all';
    }
    
    if (filters.ratings?.length) {
      updates.rating = filters.ratings[0];
    } else {
      updates.rating = 0;
    }
    
    if (filters.priceRange) {
      updates.minPrice = filters.priceRange.min;
      updates.maxPrice = filters.priceRange.max;
    } else {
      updates.minPrice = 10;
      updates.maxPrice = 10000;
    }
    
    if (filters.sort?.length) {
      updates.sort = filters.sort[0];
    } else {
      updates.sort = 'newest';
    }
    
    updateMultipleSearchParams(updates);
    
    // Close drawer
    setIsFilterOpen(false);
  }, [updateMultipleSearchParams]);

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
    
    // Reset applying state after delay
    setTimeout(() => setIsApplyingFilter(false), 200);
  }, [updateSearchParam, isFilterOpen]);

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
    category: activeCategories.length > 0 ? activeCategories.join(',') : undefined,
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
    if (activeCategories.length > 0) {
      products = products.filter(p => {
        const prodCats = Array.isArray(p.category) ? p.category : [p.category || ''];
        const prodOccs = Array.isArray(p.occasion) ? p.occasion : [p.occasion || ''];
        return activeCategories.some(ac => {
          const baseAc = getBaseFilterWord(ac);
          const catMatch = prodCats.some(pc => typeof pc === 'string' && getBaseFilterWord(pc).includes(baseAc));
          const occMatch = prodOccs.some(po => typeof po === 'string' && getBaseFilterWord(po).includes(baseAc));
          return catMatch || occMatch;
        });
      });
    }
    
    // SubCategory Filter
    if (activeSubCategory) {
      const subLower = activeSubCategory.toLowerCase().replace(/[\s-]/g, '');
      products = products.filter(p => 
        (p.subCategory && p.subCategory.toLowerCase().replace(/[\s-]/g, '').includes(subLower)) || 
        (p.cakeType && p.cakeType.toLowerCase().replace(/[\s-]/g, '').includes(subLower)) ||
        (p.variants && p.variants.some(v => v.flavor && v.flavor.toLowerCase().replace(/[\s-]/g, '').includes(subLower)))
      );
    }
    
    // Occasion Filter
    if (activeOccasion !== 'all') {
      products = products.filter(p => {
        const baseOcc = getBaseFilterWord(activeOccasion);
        const prodCats = Array.isArray(p.category) ? p.category : [p.category || ''];
        const isOccasionMatch = p.occasion?.some(o => typeof o === 'string' && getBaseFilterWord(o).includes(baseOcc));
        const isCategoryMatch = prodCats.some(pc => typeof pc === 'string' && getBaseFilterWord(pc).includes(baseOcc));
        return isOccasionMatch || isCategoryMatch;
      });
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
        const category = Array.isArray(p.category) ? p.category.join(' ').toLowerCase() : (p.category || '').toLowerCase();
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
    JSON.stringify(activeCategories), 
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
    setTimeout(() => setIsApplyingFilter(false), 200);
  }, [setSearchParams]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (activeCategories.length > 0) count += activeCategories.length;
    if (activeSubCategory) count += 1;
    if (activeOccasion !== 'all') count += 1;
    if (activeRating > 0) count += 1;
    if (priceRange[0] > 10 || priceRange[1] < 10000) count += 1;
    if (sortBy !== 'newest') count += 1;
    if (isBestseller) count += 1;
    if (isFeatured) count += 1;
    return count;
  }, [JSON.stringify(activeCategories), activeSubCategory, activeOccasion, activeRating, priceRange, sortBy, isBestseller, isFeatured]);

  const getPageTitle = () => {
    if (isBestseller) return 'Best Sellers';
    if (isFeatured) return 'Featured Delights';
    if (searchQuery) return `"${searchQuery}"`;
    if (activeCategories.length === 1) {
      const sel = categories.find(c => c.name === activeCategories[0]);
      return sel ? sel.label : activeCategories[0];
    } else if (activeCategories.length > 1) {
      return 'Multiple Categories';
    }
    return 'The Shop';
  };



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
            onClick={(e) => {
              e.preventDefault();
              let newCats;
              if (activeCategories.includes(cat.name)) {
                newCats = activeCategories.filter(c => c !== cat.name);
              } else {
                newCats = [...activeCategories, cat.name];
              }
              
              if (cat.name.toLowerCase() === 'anniversary') {
                if (activeCategories.includes(cat.name)) {
                  updateMultipleSearchParams({ category: newCats.length > 0 ? newCats.join(',') : 'all', occasion: 'all' });
                } else {
                  updateMultipleSearchParams({ category: newCats.length > 0 ? newCats.join(',') : 'all', occasion: 'anniversary-gift' });
                }
              } else if (cat.name.toLowerCase() === 'birthday-cakes' || cat.name.toLowerCase() === 'birthday') {
                if (activeCategories.includes(cat.name)) {
                  updateMultipleSearchParams({ category: newCats.length > 0 ? newCats.join(',') : 'all', occasion: 'all' });
                } else {
                  updateMultipleSearchParams({ category: newCats.length > 0 ? newCats.join(',') : 'all', occasion: 'birthday-gifts' });
                }
              } else {
                updateSearchParam('category', newCats.length > 0 ? newCats.join(',') : 'all');
              }
            }}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              activeCategories.includes(cat.name)
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
            
            {activeCategories.map(ac => (
              <span key={ac} className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-[10px] font-bold flex items-center gap-1">
                Category: {categories.find(c => c.name === ac)?.label || ac}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    const newCats = activeCategories.filter(c => c !== ac);
                    updateSearchParam('category', newCats.length > 0 ? newCats.join(',') : 'all');
                  }}
                  className="hover:text-[var(--primary)]/70"
                >
                  ×
                </button>
              </span>
            ))}
            
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
        categories={categories.map(c => c.label)}
      />

    </div>
  );
};

export default Shop;