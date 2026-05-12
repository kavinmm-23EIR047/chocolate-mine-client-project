import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SlidersHorizontal, Search, Star, X, ChevronDown, 
  LayoutGrid, List, Sliders, Filter, ArrowUpDown
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useGetProductsQuery } from '../services/api/productApi';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  
  // Filter States
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [activeOccasion, setActiveOccasion] = useState(searchParams.get('occasion') || 'All');
  const [activeRating, setActiveRating] = useState(Number(searchParams.get('rating')) || 0);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  /* Fetch initial filters */
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, occRes] = await Promise.all([
          api.get('/categories'),
          api.get('/occasions')
        ]);
        setCategories([{ name: 'All' }, ...(catRes.data?.data || [])]);
        setOccasions([{ name: 'All' }, ...(occRes.data?.data || [])]);
      } catch (error) {
        console.error('Failed to fetch filters:', error);
      }
    };
    fetchFilters();
  }, []);

  // RTK Query for Products
  const { data: productRes, isLoading: loading, isFetching } = useGetProductsQuery({
    category: activeCategory !== 'All' ? activeCategory : '',
    occasion: activeOccasion !== 'All' ? activeOccasion : '',
    rating: activeRating > 0 ? activeRating : '',
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    sort: sortBy,
    q: searchQuery,
    limit: 20
  });

  const products = productRes?.data || [];
  const totalProducts = productRes?.total || 0;


  const clearFilters = () => {
    setActiveCategory('All');
    setActiveOccasion('All');
    setActiveRating(0);
    setPriceRange([0, 5000]);
    setSortBy('newest');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-2xl xs:text-3xl lg:text-5xl font-black text-heading uppercase tracking-tighter">Shop All Cakes</h1>
            <p className="text-[10px] sm:text-sm text-muted font-black uppercase tracking-widest mt-2">
              Showing {products.length} of {totalProducts} delicious creations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative flex-grow md:w-64">
                <input 
                  type="text" 
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-card border border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
             </div>
             <button 
               onClick={() => setIsFilterOpen(true)}
               className="lg:hidden p-3 bg-primary text-button-text rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
             >
               <SlidersHorizontal size={20} />
             </button>
          </div>
        </div>

        <div className="flex gap-10">
          
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-10">
            
            {/* Category Filter */}
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted mb-6">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeCategory === cat.name 
                        ? 'bg-primary text-button-text shadow-lg' 
                        : 'bg-card text-muted border border-border/50 hover:border-primary/30'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Occasion Filter */}
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted mb-6">Occasions</h3>
              <div className="grid grid-cols-2 gap-2">
                {occasions.map((occ) => (
                  <button
                    key={occ.name}
                    onClick={() => setActiveOccasion(occ.name)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all ${
                      activeOccasion === occ.name 
                        ? 'bg-primary text-button-text shadow-md' 
                        : 'bg-card text-muted border border-border/50 hover:border-primary/30'
                    }`}
                  >
                    {occ.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted mb-6">Minimum Rating</h3>
              <div className="space-y-2">
                {[4, 3, 2].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setActiveRating(rating)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                      activeRating === rating 
                        ? 'bg-secondary/10 text-secondary border border-secondary/20' 
                        : 'hover:bg-primary/5 text-muted'
                    }`}
                  >
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          className={i < rating ? 'fill-secondary text-secondary' : 'text-border'} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">& up</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sorting */}
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted mb-6">Sort By</h3>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-card border border-border/50 rounded-2xl p-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <button 
              onClick={clearFilters}
              className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted hover:border-primary hover:text-primary transition-all"
            >
              Reset Filters
            </button>
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 gap-8">
                {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 gap-10">
                {products.map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <ProductCard product={product} layout="horizontal" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState 
                title="No products found"
                message="Try adjusting your filters or search terms."
                action={<button onClick={clearFilters} className="btn-primary">CLEAR ALL FILTERS</button>}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-[90%] max-w-sm bg-card z-[210] p-8 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-heading uppercase tracking-tighter">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-surface rounded-xl border border-border/50">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-10">
                {/* Mobile filters here - same as desktop but vertically stacked */}
                {/* Category */}
                <section>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted mb-4">Category</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setActiveCategory(cat.name)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          activeCategory === cat.name ? 'bg-primary text-button-text' : 'bg-surface text-muted border border-border/50'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Occasion */}
                <section>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted mb-4">Occasion</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {occasions.map((occ) => (
                      <button
                        key={occ.name}
                        onClick={() => setActiveOccasion(occ.name)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all ${
                          activeOccasion === occ.name ? 'bg-primary text-button-text' : 'bg-surface text-muted border border-border/50'
                        }`}
                      >
                        {occ.name}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Rating */}
                <section>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted mb-4">Minimum Rating</h3>
                  <div className="flex gap-2">
                    {[4, 3, 2].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setActiveRating(rating)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                          activeRating === rating ? 'bg-secondary text-button-text' : 'bg-surface text-muted border border-border/50'
                        }`}
                      >
                        <Star size={12} className={activeRating === rating ? 'fill-current' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{rating}+</span>
                      </button>
                    ))}
                  </div>
                </section>

                <button 
                  onClick={() => { clearFilters(); setIsFilterOpen(false); }}
                  className="w-full py-4 bg-error/5 text-error rounded-2xl text-[10px] font-black uppercase tracking-widest"
                >
                  Clear All
                </button>

                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full py-4 bg-primary text-button-text rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;
