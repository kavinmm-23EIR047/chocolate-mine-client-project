import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Search, X, Star
} from 'lucide-react';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useGetProductsQuery } from '../services/api/productApi';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';

// Removed local ProductCard definition - now using global component from ../components/ProductCard

/* ═══════════════════════════════════════════════════════
   MAIN SHOP PAGE
   ═══════════════════════════════════════════════════════ */
const Shop = () => {
  const [searchParams] = useSearchParams();
  const [isFilterOpen,  setIsFilterOpen]  = useState(false);
  const [categories,    setCategories]    = useState([]);
  const [occasions,     setOccasions]     = useState([]);

  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [activeOccasion, setActiveOccasion] = useState(searchParams.get('occasion')  || 'All');
  const [activeRating,   setActiveRating]   = useState(Number(searchParams.get('rating')) || 0);
  const [priceRange,     setPriceRange]     = useState([0, 5000]);
  const [sortBy,         setSortBy]         = useState(searchParams.get('sort')  || 'newest');
  const [searchQuery,    setSearchQuery]    = useState(searchParams.get('search') || '');
  const [isBestseller,   setIsBestseller]   = useState(searchParams.get('bestseller') === 'true');

  /* Sync URL → state on navigation */
  useEffect(() => {
    setIsBestseller(searchParams.get('bestseller') === 'true');
    setSearchQuery(searchParams.get('search')   || '');
    setActiveCategory(searchParams.get('category') || 'All');
    setActiveOccasion(searchParams.get('occasion')  || 'All');
  }, [searchParams]);

  /* Load filter options */
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, occRes] = await Promise.all([
          api.get('/categories'),
          api.get('/occasions'),
        ]);
        setCategories([{ name: 'All' }, ...(catRes.data?.data || [])]);
        setOccasions([{ name: 'All' },  ...(occRes.data?.data || [])]);
      } catch (err) {
        console.error('Failed to fetch filters:', err);
      }
    };
    fetchFilters();
  }, []);

  /* RTK Query */
  const { data: productRes, isLoading: loading } = useGetProductsQuery({
    category:   activeCategory !== 'All' ? activeCategory : '',
    occasion:   activeOccasion !== 'All' ? activeOccasion : '',
    rating:     activeRating > 0 ? activeRating : '',
    minPrice:   priceRange[0],
    maxPrice:   priceRange[1],
    sort:       sortBy,
    q:          searchQuery,
    bestseller: isBestseller ? true : '',
    limit:      20,
  });

  const products = productRes?.data || [];

  const clearFilters = () => {
    setActiveCategory('All');
    setActiveOccasion('All');
    setActiveRating(0);
    setPriceRange([0, 5000]);
    setSortBy('newest');
    setSearchQuery('');
    setIsBestseller(false);
  };

  const getPageTitle = () => {
    if (isBestseller)           return 'Best Sellers';
    if (searchQuery)            return `"${searchQuery}"`;
    if (activeCategory !== 'All') return activeCategory;
    if (activeOccasion !== 'All') return `${activeOccasion} Special`;
    return 'The Shop';
  };

  /* ── Reusable filter panel (desktop sidebar + mobile drawer) ── */
  const FilterPanel = () => (
    <div className="space-y-7">

      {/* Category */}
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-heading/80 mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCategory === cat.name
                  ? 'bg-primary text-button-text shadow-lg shadow-primary/20'
                  : 'bg-heading/5 text-heading/80 border border-heading/10 hover:border-primary/40 hover:text-primary'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Occasion */}
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-heading/80 mb-3">Occasions</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {occasions.map((occ) => (
            <button
              key={occ.name}
              onClick={() => setActiveOccasion(occ.name)}
              className={`px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all ${
                activeOccasion === occ.name
                  ? 'bg-primary text-button-text shadow-md shadow-primary/20'
                  : 'bg-heading/5 text-heading/80 border border-heading/10 hover:border-primary/40 hover:text-primary'
              }`}
            >
              {occ.name}
            </button>
          ))}
        </div>
      </section>

      {/* Rating */}
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-heading/80 mb-3">Min. Rating</h3>
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              onClick={() => setActiveRating(activeRating === r ? 0 : r)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                activeRating === r
                  ? 'bg-secondary/15 text-secondary border border-secondary/30'
                  : 'text-heading/70 hover:bg-heading/5 hover:text-heading'
              }`}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11}
                    className={i < r ? 'fill-secondary text-secondary' : 'text-heading/30'} />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">& up</span>
            </button>
          ))}
        </div>
      </section>

      {/* Price */}
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-heading/80 mb-3">
          Price — up to <span className="text-heading">₹{priceRange[1].toLocaleString()}</span>
        </h3>
        <input
          type="range" min={0} max={5000} step={100}
          value={priceRange[1]}
          onChange={(e) => setPriceRange([0, Number(e.target.value)])}
          className="w-full accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-[9px] font-bold text-heading/60 mt-1">
          <span>₹0</span><span>₹5,000</span>
        </div>
      </section>

      {/* Sort */}
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-heading/80 mb-3">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-heading/5 border border-heading/10 text-heading rounded-xl p-3
                     text-[10px] font-black uppercase tracking-widest outline-none
                     focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </section>

      <button
        onClick={clearFilters}
        className="w-full py-3 border border-dashed border-heading/15 rounded-xl
                   text-[10px] font-black uppercase tracking-widest text-heading/70
                   hover:border-primary hover:text-primary transition-all"
      >
        Reset All Filters
      </button>
    </div>
  );

  /* ── RENDER ── */
  return (
    /* pt-16 → tighter gap below navbar (was pt-28) */
    <div className="min-h-screen bg-background pt-16 pb-20">
      <div className="w-full mx-auto px-4 sm:px-8 lg:px-14">

        {/* Page Header */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-footer
                        p-6 sm:p-10 border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8 pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-accent/10 rounded-full blur-[70px] pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            {/* Breadcrumb + title */}
            <div>
              <nav className="flex items-center gap-2 mb-2.5">
                <Link to="/"
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-primary transition-colors">
                  Home
                </Link>
                <span className="text-white/40">/</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  {getPageTitle()}
                </span>
              </nav>
              <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-white/80 font-medium max-w-md">
                Artisanal delicacies, handcrafted with passion and delivered fresh to your doorstep.
              </p>
            </div>

            {/* Search + meta */}
            <div className="flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72 group">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl
                             py-3.5 pl-14 pr-10 text-sm font-bold placeholder:text-white/20
                             focus:ring-4 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all backdrop-blur-md"
                />
                <Search size={18}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]
                                 bg-white/5 px-4 py-2 rounded-xl border border-white/10 shadow-inner">
                  {products.length} {products.length === 1 ? 'Delicacy' : 'Delicacies'}
                </span>
                {/* Mobile filter button */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden p-3 bg-primary text-button-text rounded-xl
                             shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                  <SlidersHorizontal size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex gap-8">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-20">
              <FilterPanel />
            </div>
          </aside>

          {/* Product grid — Mobile: 1 col (horizontal), Tablet: 2 col (vertical), Desktop: 3 col (vertical) */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <>
                {/* Mobile skeleton */}
                <div className="grid sm:hidden grid-cols-1 gap-4">
                  {[...Array(4)].map((_, i) => <CardSkeleton key={`mob-${i}`} />)}
                </div>
                {/* Tablet/Desktop skeleton */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                  {[...Array(6)].map((_, i) => <CardSkeleton key={`desk-${i}`} />)}
                </div>
              </>
            ) : products.length > 0 ? (
              <>
                {/* Mobile grid (Horizontal cards) */}
                <div className="grid sm:hidden grid-cols-1 gap-4">
                  {products.map((product, i) => (
                    <motion.div
                      key={product._id?.$oid || product._id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.28 }}
                    >
                      <ProductCard product={product} layout="horizontal" />
                    </motion.div>
                  ))}
                </div>

                {/* Tablet/Desktop grid (Vertical cards) */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                  {products.map((product, i) => (
                    <motion.div
                      key={product._id?.$oid || product._id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.28 }}
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
                action={
                  <button onClick={clearFilters} className="btn-primary">
                    CLEAR ALL FILTERS
                  </button>
                }
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 bottom-0 w-[88%] max-w-sm bg-card z-[210] p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-7">
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)}
                  className="p-2 bg-white/5 rounded-xl border border-white/10 text-white/60 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <FilterPanel />

              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full mt-6 py-4 bg-primary text-button-text rounded-2xl
                           text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20"
              >
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
