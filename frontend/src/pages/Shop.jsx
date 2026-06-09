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
  const [mobileLayout, setMobileLayout] = useState('list');

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
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCategory === cat.name
                  ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-lg'
                  : 'bg-[var(--heading)]/5 text-[var(--heading)]/80 border border-[var(--heading)]/10 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
              }`}>
              {cat.label}
            </button>
          ))}
          <Link to="/custom-cake"
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-md hover:scale-105 flex items-center gap-1 transition-all">
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
                className={`px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all ${
                  activeOccasion === occ.name
                    ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-md'
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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                activeRating === r
                  ? 'bg-[var(--secondary)]/15 text-[var(--secondary)] border border-[var(--secondary)]/30'
                  : 'text-[var(--heading)]/70 hover:bg-[var(--heading)]/5 hover:text-[var(--heading)]'
              }`}>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} className={i < r ? 'fill-[var(--secondary)] text-[var(--secondary)]' : 'text-[var(--heading)]/30'} />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">& up</span>
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
            <label className="text-[9px] font-bold text-[var(--heading)]/60 mb-1 block">Min ₹{priceRange[0]}</label>
            <input type="range" min={10} max={10000} step={50} value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              onMouseUp={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
              onTouchEnd={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
              className="w-full accent-[var(--primary)] cursor-pointer" />
          </div>
          <div>
            <label className="text-[9px] font-bold text-[var(--heading)]/60 mb-1 block">Max ₹{priceRange[1]}</label>
            <input type="range" min={10} max={10000} step={50} value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              onMouseUp={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
              onTouchEnd={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
              className="w-full accent-[var(--primary)] cursor-pointer" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/80 mb-3">Sort By</h3>
        <select value={sortBy} onChange={(e) => updateSearchParam('sort', e.target.value)}
          className="w-full bg-[var(--heading)]/5 border border-[var(--heading)]/10 text-[var(--heading)] rounded-xl p-3 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer">
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </section>

      <button onClick={clearFilters}
        className="w-full py-3 border border-dashed border-[var(--heading)]/15 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--heading)]/70 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
        Reset All Filters
      </button>
    </div>
  );

  /* ── Mobile Top Bar: search + sort + layout toggle ── */
  const MobileTopBar = () => (
    <div className="sm:hidden mb-4 flex flex-col gap-2.5">
      {/* Search */}
      <div className="relative">
        <input type="text" placeholder="Search products..." value={searchQuery}
          onChange={(e) => updateSearchParam('search', e.target.value)}
          className="w-full bg-[var(--card)] border border-[var(--border)] text-[var(--heading)] rounded-2xl py-3 pl-11 pr-9 text-sm font-medium focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]/40 outline-none transition-all"
        />
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        {searchQuery && (
          <button onClick={() => updateSearchParam('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--heading)]">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Item count */}
        <span className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider shrink-0">
          {filteredProducts.length} items
        </span>

        <div className="flex-1" />

        {/* Sort dropdown */}
        <div className="relative">
          <select value={sortBy} onChange={(e) => updateSearchParam('sort', e.target.value)}
            className="appearance-none bg-[var(--card)] border border-[var(--border)] text-[var(--heading)] rounded-xl pl-3 pr-7 py-2 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer">
            <option value="newest">Newest</option>
            <option value="price-low">Price ↑</option>
            <option value="price-high">Price ↓</option>
            <option value="rating">Top Rated</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
        </div>

        {/* Layout toggle */}
        <div className="flex items-center bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <button onClick={() => setMobileLayout('list')}
            className={`p-2 transition-colors ${mobileLayout === 'list' ? 'bg-[var(--primary)] text-[var(--button-text)]' : 'text-[var(--muted)] hover:text-[var(--heading)]'}`}>
            <List size={14} />
          </button>
          <button onClick={() => setMobileLayout('grid')}
            className={`p-2 transition-colors ${mobileLayout === 'grid' ? 'bg-[var(--primary)] text-[var(--button-text)]' : 'text-[var(--muted)] hover:text-[var(--heading)]'}`}>
            <LayoutGrid size={14} />
          </button>
        </div>

        {/* Filter button */}
        <button onClick={() => setIsFilterOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-wider text-[var(--heading)] hover:border-[var(--primary)] transition-colors">
          <SlidersHorizontal size={13} />
          Filter
        </button>
      </div>

      {/* Category pills — horizontal scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {categories.map((cat) => (
          <button key={cat.name} onClick={() => updateSearchParam('category', cat.name)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
              activeCategory === cat.name
                ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--heading)]/70 hover:border-[var(--primary)]/40'
            }`}>
            {cat.label}
          </button>
        ))}
        <Link to="/custom-cake"
          className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap bg-gradient-to-r from-amber-400 to-pink-500 text-white">
          Custom ✨
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] pt-16 pb-20">
      <div className="w-full mx-auto px-3 sm:px-8 lg:px-14">

        {/* ── Desktop Page Header ── */}
        <div className="hidden sm:block relative mb-10 overflow-hidden rounded-3xl bg-[var(--footer)] p-6 sm:p-10 border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/8 via-transparent to-[var(--accent)]/8 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <nav className="flex items-center gap-2 mb-2.5">
                <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-[var(--primary)] transition-colors">Home</Link>
                <span className="text-white/40">/</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{getPageTitle()}</span>
              </nav>
              <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">{getPageTitle()}</h1>
              <p className="text-xs text-white/80 font-medium max-w-md">Premium handcrafted confectionery, customized with passion and delivered fresh to your door.</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="relative w-72 group">
                <input type="text" placeholder="Search products..." value={searchQuery}
                  onChange={(e) => updateSearchParam('search', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3.5 pl-14 pr-10 text-sm font-bold focus:ring-4 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]/40 outline-none transition-all backdrop-blur-md"
                />
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60" />
                {searchQuery && (
                  <button onClick={() => updateSearchParam('search', '')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>
              <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Mobile: compact title ── */}
        <div className="sm:hidden flex items-center justify-between mb-3 pt-1">
          <div>
            <h1 className="text-xl font-black text-[var(--heading)] uppercase tracking-tight leading-none">{getPageTitle()}</h1>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">Discover our artisan cakes made with love.</p>
          </div>
        </div>

        {/* ── Mobile Top Bar ── */}
        <MobileTopBar />

        {/* ── Layout Body ── */}
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-20"><FilterPanel /></div>
          </aside>

          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                {/* ── Mobile: list (1-col horizontal) or grid (2-col vertical) ── */}
                <div className="sm:hidden">
                  {mobileLayout === 'list' ? (
                    <div className="flex flex-col gap-3">
                      {filteredProducts.map((product, i) => (
                        <motion.div key={product._id?.$oid || product._id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                          <ProductCard product={product} layout="horizontal" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {filteredProducts.map((product, i) => (
                        <motion.div key={product._id?.$oid || product._id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                          <ProductCard product={product} layout="vertical" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Desktop: 2-col (sm) → 3-col (lg) vertical grid ── */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                  {filteredProducts.map((product, i) => (
                    <motion.div key={product._id?.$oid || product._id}
                      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <ProductCard product={product} layout="vertical" />
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="No products found"
                message="Try adjusting your filters or search terms."
                action={<button onClick={clearFilters} className="btn-primary">Clear All Filters</button>}
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
              className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[200]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="fixed right-0 top-0 bottom-0 w-[88%] max-w-sm bg-[var(--card)] z-[210] p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-7">
                <h2 className="text-xl font-black text-[var(--heading)] uppercase tracking-tighter">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-[var(--card-soft)] rounded-xl border border-[var(--border)] text-[var(--muted)]">
                  <X size={18} />
                </button>
              </div>
              <FilterPanel />
              <button onClick={() => setIsFilterOpen(false)}
                className="w-full mt-6 py-4 bg-[var(--primary)] text-[var(--button-text)] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
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
