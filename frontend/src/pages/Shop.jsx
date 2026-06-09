import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Search, X, Star, ChevronDown, LayoutGrid, List, Filter,
  ChevronRight, Clock, TrendingUp, Heart, Zap, Shield
} from 'lucide-react';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useGetProductsQuery } from '../product/productApi';
import api from '../utils/api';
import ProductCard from '../product/ProductCard';

/* ═══════════════════════════════════════════════════════
   MAIN SHOP PAGE - MODERN GRID LAYOUT
   ═══════════════════════════════════════════════════════ */
const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [mobileLayout, setMobileLayout] = useState('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const activeCategory = searchParams.get('category') || 'all';
  const activeOccasion = searchParams.get('occasion') || 'all';
  const activeRating   = Number(searchParams.get('rating')) || 0;
  const sortBy         = searchParams.get('sort') || 'newest';
  const searchQuery    = searchParams.get('search') || '';
  const isBestseller   = searchParams.get('bestseller') === 'true';
  const isFeatured     = searchParams.get('featured') === 'true';

  const [priceRange, setPriceRange] = useState([
    Number(searchParams.get('minPrice')) || 10,
    Number(searchParams.get('maxPrice')) || 10000,
  ]);

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: <TrendingUp size={12} /> },
    { value: 'price-low', label: 'Price: Low to High', icon: <ChevronDown size={12} /> },
    { value: 'price-high', label: 'Price: High to Low', icon: <ChevronDown size={12} className="rotate-180" /> },
    { value: 'rating', label: 'Top Rated', icon: <Star size={12} /> },
  ];

  const getSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : 'Sort by';
  };

  const updateSearchParam = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === 'all' || value === 0 || value === false) next.delete(key);
      else next.set(key, String(value));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    setPriceRange([
      Number(searchParams.get('minPrice')) || 10,
      Number(searchParams.get('maxPrice')) || 10000,
    ]);
  }, [searchParams]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const categoriesRes = await api.get('/categories');
        const dbCats = categoriesRes.data?.data || categoriesRes.data || [];
        setCategories([
          { name: 'all', label: 'All' },
          ...dbCats.filter(c => c.isActive !== false).map(c => ({ name: c.name, label: c.label || c.name.replace(/-/g, ' ') })),
        ]);

        const occasionsRes = await api.get('/occasions');
        const dbOcc = occasionsRes.data?.data || occasionsRes.data || [];
        setOccasions([
          { name: 'all', label: 'All' },
          ...dbOcc.filter(o => o.isActive !== false).map(o => ({ name: o.name, label: o.label || o.name.replace(/-/g, ' ') })),
        ]);
      } catch {
        setCategories([
          { name: 'all', label: 'All' },
          { name: 'chocolate-cakes', label: 'Chocolate Cakes' },
          { name: 'bento-cakes',     label: 'Bento Cakes' },
          { name: 'flowers',         label: 'Flowers' },
          { name: 'chocolates',      label: 'Chocolates' },
          { name: 'candles',         label: 'Candles' },
        ]);
        setOccasions([{ name: 'all', label: 'All' }]);
      }
    };
    fetchFilters();
  }, []);

  const { data: productRes, isLoading: loading } = useGetProductsQuery({ page: 1, limit: 1000 });

  const filteredProducts = useMemo(() => {
    let products = productRes?.data ? [...productRes.data] : [];
    if (activeCategory !== 'all') products = products.filter(p => p.category === activeCategory);
    if (activeOccasion !== 'all') products = products.filter(p => p.occasion?.some(o => o.toLowerCase() === activeOccasion.toLowerCase()));
    if (activeRating > 0) products = products.filter(p => p.ratingsAverage >= activeRating);
    products = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      products = products.filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (isBestseller) products = products.filter(p => p.bestseller === true);
    if (isFeatured)   products = products.filter(p => p.featured   === true);

    const sorted = [...products];
    if (sortBy === 'price-low')  sorted.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') sorted.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating')     sorted.sort((a, b) => b.ratingsAverage - a.ratingsAverage);
    if (sortBy === 'newest')     sorted.sort((a, b) => {
      const da = a.createdAt?.$date ? new Date(a.createdAt.$date) : new Date(a.createdAt || 0);
      const db = b.createdAt?.$date ? new Date(b.createdAt.$date) : new Date(b.createdAt || 0);
      return db - da;
    });
    return sorted;
  }, [productRes?.data, activeCategory, activeOccasion, activeRating, priceRange, searchQuery, isBestseller, isFeatured, sortBy]);

  const clearFilters = () => { setSearchParams(new URLSearchParams(), { replace: true }); setPriceRange([10, 10000]); };

  const getPageTitle = () => {
    if (isBestseller) return 'Best Sellers';
    if (isFeatured)   return 'Featured Delights';
    if (searchQuery)  return `"${searchQuery}"`;
    if (activeCategory !== 'all') {
      const sel = categories.find(c => c.name === activeCategory);
      return sel ? sel.label : activeCategory;
    }
    return 'Shop All';
  };

  /* ── Filter Panel ── */
  const FilterPanel = () => (
    <div className="space-y-6">
      <section>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/70 mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat.name} onClick={() => updateSearchParam('category', cat.name)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                activeCategory === cat.name
                  ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-md'
                  : 'bg-[var(--heading)]/5 text-[var(--heading)]/70 border border-[var(--heading)]/10 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {occasions.length > 1 && (
        <section>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/70 mb-3">Occasions</h3>
          <div className="grid grid-cols-2 gap-2">
            {occasions.map((occ) => (
              <button key={occ.name} onClick={() => updateSearchParam('occasion', occ.name)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-left transition-all ${
                  activeOccasion === occ.name
                    ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-md'
                    : 'bg-[var(--heading)]/5 text-[var(--heading)]/70 border border-[var(--heading)]/10 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
                }`}>
                {occ.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/70 mb-3">Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2].map((r) => (
            <button key={r} onClick={() => updateSearchParam('rating', activeRating === r ? 0 : r)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                activeRating === r
                  ? 'bg-[var(--secondary)]/15 text-[var(--secondary)] border border-[var(--secondary)]/30'
                  : 'text-[var(--heading)]/70 hover:bg-[var(--heading)]/5'
              }`}>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} className={i < r ? 'fill-[var(--secondary)] text-[var(--secondary)]' : 'text-[var(--heading)]/30'} />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider">& up</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/70 mb-3">Price Range</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-bold text-[var(--heading)]/60">
            <span>₹{priceRange[0].toLocaleString()}</span>
            <span>₹{priceRange[1].toLocaleString()}</span>
          </div>
          <div className="relative">
            <input type="range" min={10} max={10000} step={50} value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              onMouseUp={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(priceRange[0]/10000)*100}%, var(--border) ${(priceRange[0]/10000)*100}%, var(--border) 100%)` }}
            />
            <input type="range" min={10} max={10000} step={50} value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              onMouseUp={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
              className="w-full h-1 rounded-full appearance-none cursor-pointer -mt-1"
              style={{ background: `linear-gradient(to right, var(--border) 0%, var(--border) ${(priceRange[1]/10000)*100}%, var(--primary) ${(priceRange[1]/10000)*100}%, var(--primary) 100%)` }}
            />
          </div>
        </div>
      </section>

      <button onClick={clearFilters}
        className="w-full py-3 border border-dashed border-[var(--heading)]/15 rounded-xl text-[10px] font-black uppercase tracking-wider text-[var(--heading)]/70 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
        Reset All Filters
      </button>
    </div>
  );

  /* ── Mobile Bottom Sheet Filter ── */
  const MobileFilterSheet = () => (
    <AnimatePresence>
      {isFilterOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsFilterOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-0 left-0 right-0 bg-[var(--card)] rounded-t-3xl z-[210] p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-[var(--border)]">
              <h2 className="text-lg font-black text-[var(--heading)] uppercase tracking-tighter">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-[var(--card-soft)] rounded-xl">
                <X size={18} style={{ color: 'var(--muted)' }} />
              </button>
            </div>
            <FilterPanel />
            <button onClick={() => setIsFilterOpen(false)}
              className="w-full mt-6 py-3.5 bg-[var(--primary)] text-[var(--button-text)] rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg">
              Apply Filters
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] pt-16 pb-16">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Hero Section ── */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent)]/5 p-6 sm:p-8">
          <div className="relative z-10">
            <nav className="flex items-center gap-2 text-xs text-[var(--muted)] mb-3">
              <Link to="/" className="hover:text-[var(--primary)] transition-colors">Home</Link>
              <ChevronRight size={12} />
              <span className="font-medium text-[var(--heading)]">{getPageTitle()}</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--heading)] uppercase tracking-tighter leading-tight">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-[var(--muted)] mt-2 max-w-2xl">
              Discover our collection of premium handcrafted delights, made with love and delivered fresh to your door.
            </p>
          </div>
        </div>

        {/* ── Mobile: Search & Filters Bar ── */}
        <div className="lg:hidden mb-5 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => updateSearchParam('search', e.target.value)}
              className="w-full bg-[var(--card)] border border-[var(--border)] text-[var(--heading)] rounded-xl py-3 pl-10 pr-9 text-sm font-medium placeholder:text-[var(--muted)]/60 focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]/40 outline-none transition-all"
            />
            {searchQuery && (
              <button onClick={() => updateSearchParam('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={16} className="text-[var(--muted)] hover:text-[var(--heading)]" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => updateSearchParam('category', cat.name)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    activeCategory === cat.name
                      ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                      : 'bg-[var(--card)] border border-[var(--border)] text-[var(--heading)]/70'
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-wider text-[var(--heading)]">
              <TrendingUp size={12} />
              {getSortLabel().split(':')[0]}
              <ChevronDown size={10} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              onClick={() => setIsFilterOpen(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-wider text-[var(--heading)]">
              <Filter size={12} />
              Filter
            </button>
          </div>

          {/* Sort Dropdown Menu */}
          {showSortMenu && (
            <div className="absolute right-4 mt-1 z-50 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden min-w-[180px]">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    updateSearchParam('sort', option.value);
                    setShowSortMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                    sortBy === option.value
                      ? 'bg-[var(--primary)] text-[var(--button-text)]'
                      : 'text-[var(--heading)] hover:bg-[var(--heading)]/5'
                  }`}>
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop: Stats Bar ── */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-[var(--heading)]">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
            </span>
            <div className="h-4 w-px bg-[var(--border)]" />
            <div className="flex items-center gap-2">
              {isBestseller && <span className="badge-bestseller text-[9px]">Best Sellers</span>}
              {isFeatured && <span className="badge-featured text-[9px]">Featured</span>}
              {activeCategory !== 'all' && (
                <span className="bg-[var(--heading)]/5 px-2 py-0.5 rounded-full text-[9px] font-bold text-[var(--heading)]/70">
                  {categories.find(c => c.name === activeCategory)?.label}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => updateSearchParam('sort', e.target.value)}
                className="bg-[var(--card)] border border-[var(--border)] text-[var(--heading)] rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wider outline-none cursor-pointer appearance-none pr-8">
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
            </div>
            
            <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
              <button
                onClick={() => setMobileLayout('grid')}
                className={`p-2 transition-colors ${mobileLayout === 'grid' ? 'bg-[var(--primary)] text-[var(--button-text)]' : 'text-[var(--muted)]'}`}>
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setMobileLayout('list')}
                className={`p-2 transition-colors ${mobileLayout === 'list' ? 'bg-[var(--primary)] text-[var(--button-text)]' : 'text-[var(--muted)]'}`}>
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20 space-y-6">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => updateSearchParam('search', e.target.value)}
                  className="w-full bg-[var(--card)] border border-[var(--border)] text-[var(--heading)] rounded-xl py-2.5 pl-9 pr-3 text-sm placeholder:text-[var(--muted)]/60 focus:ring-2 focus:ring-[var(--primary)]/20 outline-none"
                />
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                {/* Mobile/Tablet Grid */}
                <div className="lg:hidden">
                  {mobileLayout === 'list' ? (
                    <div className="flex flex-col gap-3">
                      {filteredProducts.map((product, i) => (
                        <motion.div
                          key={product._id?.$oid || product._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}>
                          <ProductCard product={product} layout="horizontal" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {filteredProducts.map((product, i) => (
                        <motion.div
                          key={product._id?.$oid || product._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}>
                          <ProductCard product={product} layout="vertical" cardStyle="rounded-lg" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop Grid */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-5 xl:gap-6">
                  {filteredProducts.map((product, i) => (
                    <motion.div
                      key={product._id?.$oid || product._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}>
                      <ProductCard product={product} layout="vertical" cardStyle="rounded-lg" />
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="No products found"
                message="Try adjusting your filters or search terms."
                action={
                  <button onClick={clearFilters} className="neo-btn text-sm">
                    Clear All Filters
                  </button>
                }
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet />
    </div>
  );
};

export default Shop;
