import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Search, X, Star
} from 'lucide-react';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useGetProductsQuery } from '../product/productApi';
import api from '../utils/api';
import ProductCard from '../product/ProductCard';

/* ═══════════════════════════════════════════════════════
   MAIN SHOP PAGE (CLEANED - CATEGORIES ONLY)
   ═══════════════════════════════════════════════════════ */
const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categories, setCategories] = useState([]); // Dynamic Admin Categories
  const [occasions, setOccasions] = useState([]);

  // Sync state directly from URL query parameters
  const activeCategory = searchParams.get('category') || 'all';
  const activeOccasion = searchParams.get('occasion') || 'all';
  const activeRating = Number(searchParams.get('rating')) || 0;
  const sortBy = searchParams.get('sort') || 'newest';
  const searchQuery = searchParams.get('search') || '';
  const isBestseller = searchParams.get('bestseller') === 'true';
  const isFeatured = searchParams.get('featured') === 'true';

  // Local state for smooth slider tracking
  const [priceRange, setPriceRange] = useState([
    Number(searchParams.get('minPrice')) || 10,
    Number(searchParams.get('maxPrice')) || 10000
  ]);

  /* Unified Router Param Updater */
  const updateSearchParam = useCallback((key, value) => {
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      if (!value || value === 'all' || value === 0 || value === false) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
      return nextParams;
    }, { replace: true });
  }, [setSearchParams]);

  /* Sync URL → Price State on Back/Forward navigation */
  useEffect(() => {
    setPriceRange([
      Number(searchParams.get('minPrice')) || 10,
      Number(searchParams.get('maxPrice')) || 10000
    ]);
  }, [searchParams]);

  /* Load filter options dynamically from Admin Categories endpoint & Products */
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Fetch Categories directly from your Categories Database Schema
        const categoriesRes = await api.get('/categories');
        const dbCategories = categoriesRes.data?.data || categoriesRes.data || [];

        const activeDbCats = dbCategories
          .filter(cat => cat.isActive !== false)
          .map(cat => ({
            name: cat.name,
            label: cat.label || cat.name.replace(/-/g, ' ')
          }));

        setCategories([{ name: 'all', label: 'All' }, ...activeDbCats]);

        // Fetch Occasions directly from Occasions Database Schema
        const occasionsRes = await api.get('/occasions');
        const dbOccasions = occasionsRes.data?.data || occasionsRes.data || [];

        const activeDbOccasions = dbOccasions
          .filter(occ => occ.isActive !== false)
          .map(occ => ({
            name: occ.name,
            label: occ.label || occ.name.replace(/-/g, ' ')
          }));

        setOccasions([{ name: 'all', label: 'All' }, ...activeDbOccasions]);

      } catch (err) {
        console.error('Failed to load filter updates:', err);
        setCategories([
          { name: 'all', label: 'All' },
          { name: 'chocolate-cakes', label: 'Chocolate Cakes' },
          { name: 'bento-cakes', label: 'Bento Cakes' },
          { name: 'flowers', label: 'Flowers' },
          { name: 'chocolates', label: 'Chocolates' },
          { name: 'candles', label: 'Candles' }
        ]);
        setOccasions([{ name: 'all', label: 'All' }]);
      }
    };
    fetchFilters();
  }, []);

  /* RTK Query */
  const { data: productRes, isLoading: loading } = useGetProductsQuery({ page: 1, limit: 1000 });

  /* Filter and Sort Logic */
  const filteredProducts = useMemo(() => {
    let products = productRes?.data ? [...productRes.data] : [];

    // 1. Filter by Main Category (Matches dynamic schema field 'category')
    if (activeCategory !== 'all') {
      products = products.filter(p => p.category === activeCategory);
    }

    // 2. Filter by Occasion
    if (activeOccasion !== 'all') {
      products = products.filter(p =>
        p.occasion?.some(occ => occ.toLowerCase() === activeOccasion.toLowerCase())
      );
    }

    // 3. Filter by Rating
    if (activeRating > 0) {
      products = products.filter(p => p.ratingsAverage >= activeRating);
    }

    // 4. Filter by Price Range
    products = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // 5. Search Query Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    // 6. Bestseller Filter
    if (isBestseller) {
      products = products.filter(p => p.bestseller === true);
    }

    // 7. Featured Filter
    if (isFeatured) {
      products = products.filter(p => p.featured === true);
    }

    // Sorting Logic
    const sortedProducts = [...products];
    if (sortBy === 'price-low') sortedProducts.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') sortedProducts.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') sortedProducts.sort((a, b) => b.ratingsAverage - a.ratingsAverage);
    else if (sortBy === 'newest') {
      sortedProducts.sort((a, b) => {
        const dateA = a.createdAt?.$date ? new Date(a.createdAt.$date) : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.$date ? new Date(b.createdAt.$date) : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    }

    return sortedProducts;
  }, [productRes?.data, activeCategory, activeOccasion, activeRating, priceRange, searchQuery, isBestseller, sortBy]);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setPriceRange([10, 10000]);
  };

  const getPageTitle = () => {
    if (isBestseller) return 'Best Sellers';
    if (isFeatured) return 'Featured Delights';
    if (searchQuery) return `"${searchQuery}"`;
    if (activeCategory !== 'all') {
      const selected = categories.find(c => c.name === activeCategory);
      return selected ? selected.label : activeCategory;
    }
    return 'The Shop';
  };

  /* ── Reusable clean filter panel ── */
  const FilterPanel = () => (
    <div className="space-y-7">

      {/* Dynamic Main Categories Section */}
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-heading/80 mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => updateSearchParam('category', cat.name)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat.name
                  ? 'bg-primary text-button-text shadow-lg shadow-primary/20'
                  : 'bg-heading/5 text-heading/80 border border-heading/10 hover:border-primary/40 hover:text-primary'
                }`}
            >
              {cat.label}
            </button>
          ))}
          <Link
            to="/custom-cake"
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-md shadow-pink-500/20 hover:scale-105 flex items-center gap-1"
          >
            Custom Cakes ✨
          </Link>
        </div>
      </section>

      {/* Occasions */}
      {occasions.length > 1 && (
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-heading/80 mb-3">Occasions</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {occasions.map((occ) => (
              <button
                key={occ.name}
                onClick={() => updateSearchParam('occasion', occ.name)}
                className={`px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all ${activeOccasion === occ.name
                    ? 'bg-primary text-button-text shadow-md shadow-primary/20'
                    : 'bg-heading/5 text-heading/80 border border-heading/10 hover:border-primary/40 hover:text-primary'
                  }`}
              >
                {occ.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Rating */}
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-heading/80 mb-3">Min. Rating</h3>
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              onClick={() => updateSearchParam('rating', activeRating === r ? 0 : r)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${activeRating === r
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

      {/* Price Limit Sliders */}
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-heading/80 mb-3">
          Price Range — ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
        </h3>
        <div className="mb-4">
          <label className="text-[9px] font-bold text-heading/60 mb-1 block">Min Price: ₹{priceRange[0]}</label>
          <input
            type="range" min={10} max={10000} step={50}
            value={priceRange[0]}
            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
            onMouseUp={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
            onTouchEnd={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
            className="w-full accent-primary cursor-pointer"
          />
        </div>
        <div>
          <label className="text-[9px] font-bold text-heading/60 mb-1 block">Max Price: ₹{priceRange[1]}</label>
          <input
            type="range" min={10} max={10000} step={50}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            onMouseUp={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
            onTouchEnd={() => { updateSearchParam('minPrice', priceRange[0]); updateSearchParam('maxPrice', priceRange[1]); }}
            className="w-full accent-primary cursor-pointer"
          />
        </div>
      </section>

      {/* Sort */}
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-heading/80 mb-3">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => updateSearchParam('sort', e.target.value)}
          className="w-full bg-heading/5 border border-heading/10 text-heading rounded-xl p-3 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </section>

      <button
        onClick={clearFilters}
        className="w-full py-3 border border-dashed border-heading/15 rounded-xl text-[10px] font-black uppercase tracking-widest text-heading/70 hover:border-primary hover:text-primary transition-all"
      >
        Reset All Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-16 pb-20">
      <div className="w-full mx-auto px-4 sm:px-8 lg:px-14">

        {/* Page Header */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-footer p-6 sm:p-10 border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <nav className="flex items-center gap-2 mb-2.5">
                <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-primary transition-colors">Home</Link>
                <span className="text-white/40">/</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{getPageTitle()}</span>
              </nav>
              <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">{getPageTitle()}</h1>
              <p className="text-xs text-white/80 font-medium max-w-md">Premium handcrafted confectionery, customized with passion and delivered fresh to your door.</p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72 group">
                <input
                  type="text" placeholder="Search products..." value={searchQuery}
                  onChange={(e) => updateSearchParam('search', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3.5 pl-14 pr-10 text-sm font-bold focus:ring-4 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all backdrop-blur-md"
                />
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60" />
                {searchQuery && (
                  <button onClick={() => updateSearchParam('search', '')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-xl border border-white/10 shadow-inner">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'Item' : 'Items'}
                </span>
                <button onClick={() => setIsFilterOpen(true)} className="lg:hidden p-3 bg-primary text-button-text rounded-xl shadow-xl hover:scale-105 transition-transform">
                  <SlidersHorizontal size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Body */}
        <div className="flex gap-8">
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-20"><FilterPanel /></div>
          </aside>

          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid sm:hidden grid-cols-1 gap-4">
                  {filteredProducts.map((product, i) => (
                    <motion.div key={product._id?.$oid || product._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <ProductCard product={product} layout="horizontal" />
                    </motion.div>
                  ))}
                </div>
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                  {filteredProducts.map((product, i) => (
                    <motion.div key={product._id?.$oid || product._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <ProductCard product={product} layout="vertical" />
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title="No products found" message="Try adjusting your filters or search terms." action={<button onClick={clearFilters} className="btn-primary">CLEAR ALL FILTERS</button>} />
            )}
          </main>
        </div>
      </div>

      {/* Drawer Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFilterOpen(false)} className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[200]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28 }} className="fixed right-0 top-0 bottom-0 w-[88%] max-w-sm bg-card z-[210] p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-7">
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-white/5 rounded-xl border text-white/60"><X size={18} /></button>
              </div>
              <FilterPanel />
              <button onClick={() => setIsFilterOpen(false)} className="w-full mt-6 py-4 bg-primary text-button-text rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Show Results</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;