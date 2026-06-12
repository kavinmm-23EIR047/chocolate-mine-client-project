import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Search, X, Star, ChevronDown, LayoutGrid, List
} from 'lucide-react';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useGetProductsQuery } from '../product/productApi';
import api from '../utils/api';
import ProductCard from '../product/ProductCard';

/* ═══════════════════════════════════════════════════════
   MAIN SHOP PAGE
   ═══════════════════════════════════════════════════════ */
const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  // Mobile layout toggle: 'list' (horizontal, 1-col) or 'grid' (vertical, 2-col)
  const [mobileLayout, setMobileLayout] = useState('grid');

  const activeCategory = searchParams.get('category') || 'all';
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
          { name: 'bento-cakes', label: 'Bento Cakes' },
          { name: 'flowers', label: 'Flowers' },
          { name: 'chocolates', label: 'Chocolates' },
          { name: 'candles', label: 'Candles' },
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
    if (isFeatured) products = products.filter(p => p.featured === true);

    const sorted = [...products];
    if (sortBy === 'price-low') sorted.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') sorted.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') sorted.sort((a, b) => b.ratingsAverage - a.ratingsAverage);
    if (sortBy === 'newest') sorted.sort((a, b) => {
      const da = a.createdAt?.$date ? new Date(a.createdAt.$date) : new Date(a.createdAt || 0);
      const db = b.createdAt?.$date ? new Date(b.createdAt.$date) : new Date(b.createdAt || 0);
      return db - da;
    });
    return sorted;
  }, [productRes?.data, activeCategory, activeOccasion, activeRating, priceRange, searchQuery, isBestseller, isFeatured, sortBy]);

  const clearFilters = () => { setSearchParams(new URLSearchParams(), { replace: true }); setPriceRange([10, 10000]); };

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

  /* ── Filter Panel ── */
  const FilterPanel = () => (
    <div className="space-y-7">
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/80 mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat.name} onClick={() => updateSearchParam('category', cat.name)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                activeCategory === cat.name
                  ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                  : 'bg-[var(--heading)]/5 text-[var(--heading)]/80 border border-[var(--heading)]/10 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
              }`}>
              {cat.label}
            </button>
          ))}
          <Link to="/custom-cake"
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-md hover:scale-105 flex items-center gap-1 transition-all">
            Custom Cakes ✨
          </Link>
        </div>
      </section>

      {occasions.length > 1 && (
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/80 mb-3">Occasions</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {occasions.map((occ) => (
              <button key={occ.name} onClick={() => updateSearchParam('occasion', occ.name)}
                className={`px-2 py-2 rounded-lg text-[11px] font-bold text-left transition-all ${
                  activeOccasion === occ.name
                    ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                    : 'bg-[var(--heading)]/5 text-[var(--heading)]/80 border border-[var(--heading)]/10 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
                }`}>
                {occ.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/80 mb-3">Min. Rating</h3>
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <button key={r} onClick={() => updateSearchParam('rating', activeRating === r ? 0 : r)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                activeRating === r
                  ? 'bg-[var(--secondary)]/15 text-[var(--secondary)] border border-[var(--secondary)]/30'
                  : 'text-[var(--heading)]/70 hover:bg-[var(--heading)]/5 hover:text-[var(--heading)]'
              }`}>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className={i < r ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-[var(--heading)]/30'} />
                ))}
              </div>
              <span className="text-[11px] font-bold">&amp; up</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/80 mb-3">
          Price — ₹{priceRange[0].toLocaleString()} – ₹{priceRange[1].toLocaleString()}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-[var(--heading)]/60 mb-1 block">Min ₹{priceRange[0]}</label>
            <input type="range" min={10} max={10000} step={50} value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              onMouseUp={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
              onTouchEnd={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
              className="w-full h-1.5 bg-[var(--border)] rounded-full appearance-none accent-[var(--primary)] cursor-pointer" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[var(--heading)]/60 mb-1 block">Max ₹{priceRange[1]}</label>
            <input type="range" min={10} max={10000} step={50} value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              onMouseUp={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
              onTouchEnd={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
              className="w-full h-1.5 bg-[var(--border)] rounded-full appearance-none accent-[var(--primary)] cursor-pointer" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/80 mb-3">Sort By</h3>
        <select value={sortBy} onChange={(e) => updateSearchParam('sort', e.target.value)}
          className="w-full bg-[var(--heading)]/5 border border-[var(--heading)]/10 text-[var(--heading)] rounded-lg p-2.5 text-[12px] font-bold outline-none cursor-pointer">
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </section>

      <button onClick={clearFilters}
        className="w-full py-3 border border-dashed border-[var(--heading)]/20 rounded-lg text-[12px] font-bold text-[var(--heading)]/80 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
        Reset All Filters
      </button>
    </div>
  );

  /* ── Mobile Top Bar: search + sort + layout toggle ── */
  const MobileTopBar = () => (
    <div className="sm:hidden mb-4 flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input type="text" placeholder="Search products..." value={searchQuery}
          onChange={(e) => updateSearchParam('search', e.target.value)}
          className="w-full bg-[var(--card)] border border-[var(--border)] text-[var(--heading)] rounded-lg py-2.5 pl-10 pr-9 text-sm font-medium focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
        />
        {searchQuery && (
          <button onClick={() => updateSearchParam('search', '')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--heading)]">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        <button onClick={() => setIsFilterOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[12px] font-bold text-[var(--heading)] hover:border-[var(--primary)] transition-colors">
          <SlidersHorizontal size={14} /> Filter
        </button>

        {/* Sort dropdown */}
        <div className="relative flex-1">
          <select value={sortBy} onChange={(e) => updateSearchParam('sort', e.target.value)}
            className="w-full appearance-none bg-[var(--card)] border border-[var(--border)] text-[var(--heading)] rounded-lg pl-3 pr-7 py-2.5 text-[12px] font-bold outline-none cursor-pointer">
            <option value="newest">Newest</option>
            <option value="price-low">Price ↑</option>
            <option value="price-high">Price ↓</option>
            <option value="rating">Top Rated</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
        </div>

        {/* Layout toggle */}
        <div className="flex items-center bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden shrink-0 h-[42px]">
          <button onClick={() => setMobileLayout('list')}
            className={`h-full px-3 transition-colors ${mobileLayout === 'list' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[var(--heading)]'}`}>
            <List size={16} />
          </button>
          <button onClick={() => setMobileLayout('grid')}
            className={`h-full px-3 transition-colors ${mobileLayout === 'grid' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[var(--heading)]'}`}>
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Category pills — horizontal scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button key={cat.name} onClick={() => updateSearchParam('category', cat.name)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.name
                ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--heading)]/80 hover:border-[var(--primary)]/40'
            }`}>
            {cat.label}
          </button>
        ))}
        <Link to="/custom-cake"
          className="shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap bg-gradient-to-r from-amber-400 to-pink-500 text-white">
          Custom ✨
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] pt-8 sm:pt-12 lg:pt-16 pb-24">
      <div className="responsive-container">

        {/* ── Desktop Page Header ── */}
        <div className="hidden sm:block relative mb-8 overflow-hidden rounded-2xl bg-[var(--footer)] p-6 sm:p-10 tv:p-14 border border-white/5 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/8 via-transparent to-[var(--accent)]/8 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <nav className="flex items-center gap-2 mb-2">
                <Link to="/" className="text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-[var(--primary)] transition-colors">Home</Link>
                <span className="text-white/40">/</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">{getPageTitle()}</span>
              </nav>
              <h1 className="text-3xl sm:text-4xl tv:text-6xl font-black text-white leading-tight mb-2">{getPageTitle()}</h1>
              <p className="text-sm text-white/80 font-medium max-w-md">Premium handcrafted confectionery, customized with passion and delivered fresh to your door.</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="relative w-full sm:w-72 desktop-large:w-96 group">
                <input type="text" placeholder="Search products..." value={searchQuery}
                  onChange={(e) => updateSearchParam('search', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-12 pr-10 text-sm font-medium focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all backdrop-blur-md placeholder:text-white/40"
                />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
                {searchQuery && (
                  <button onClick={() => updateSearchParam('search', '')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                    <X size={16} />
                  </button>
                )}
              </div>
              <span className="text-[11px] font-bold text-white/80 bg-white/5 px-4 py-1.5 rounded-lg border border-white/10">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Mobile: compact title ── */}
        <div className="sm:hidden flex items-start justify-between gap-3 mb-3 pt-1">
          <div className="min-w-0">
            <h1 className="text-xl font-black text-[var(--heading)] leading-none">{getPageTitle()}</h1>
            <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">Discover our artisan cakes made with love.</p>
          </div>
          <span className="text-[10px] font-bold text-[var(--muted)] shrink-0">
            {filteredProducts.length} items
          </span>
        </div>

        {/* ── Mobile Top Bar ── */}
        <MobileTopBar />

        {/* ── Layout Body ── */}
        <div className="flex gap-6 lg:gap-8 tv:gap-12">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 tv:w-80 shrink-0">
            <div className="sticky top-20"><FilterPanel /></div>
          </aside>

          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
                {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                {/* ── Mobile: list (1-col horizontal) or grid (2-col vertical) ── */}
                <div className="sm:hidden">
                  {mobileLayout === 'list' ? (
                    <div className="flex flex-col gap-1.5">
                      {filteredProducts.map((product, i) => (
                        <motion.div key={product._id?.$oid || product._id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                          <ProductCard product={product} layout="horizontal" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {filteredProducts.map((product, i) => (
                        <motion.div key={product._id?.$oid || product._id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                          <ProductCard product={product} layout="vertical" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Desktop/Tablet: 4-col vertical grid ── */}
                <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
                  {filteredProducts.map((product, i) => (
                    <motion.div key={product._id?.$oid || product._id}
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
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

      {/* ── Mobile Filter Drawer ── */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[85%] max-w-sm bg-[var(--card)] z-[210] p-5 overflow-y-auto shadow-2xl border-l border-[var(--border)]">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-bold text-[var(--heading)]">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-[var(--card-soft)] rounded-full text-[var(--muted)] hover:text-[var(--heading)] transition-colors">
                  <X size={18} />
                </button>
              </div>
              <FilterPanel />
              <button onClick={() => setIsFilterOpen(false)}
                className="w-full mt-6 py-3.5 bg-[var(--primary)] text-[var(--button-text)] rounded-lg text-[13px] font-bold shadow-md">
                Show Results
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;
