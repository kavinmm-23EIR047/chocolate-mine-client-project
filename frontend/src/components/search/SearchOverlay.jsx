import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Clock, ArrowRight, Sparkles, History, ShoppingBag, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import productService from '../../services/productService';

const SearchOverlay = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(saved);
    if (isOpen) {
      fetchRecommended();
    }
  }, [isOpen]);

  const fetchRecommended = async () => {
    try {
      const res = await productService.getFeatured({ limit: 4 });
      setRecommended(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await productService.search({ q: val, limit: 6 });
      setResults(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSelect = (q) => {
    if (!q.trim()) return;
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setRecentSearches(updated);
    navigate(`/shop?search=${encodeURIComponent(q)}`);
    onClose();
  };

  const clearRecent = (e) => {
    e.stopPropagation();
    localStorage.removeItem('recentSearches');
    setRecentSearches([]);
  };

  const trending = ['Belgian Truffle', 'Eggless Cakes', 'Birthday Specials', 'Fruit Delights', 'Dark Chocolate'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-footer/80 backdrop-blur-xl z-[200]"
          />

          {/* Search Container */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 bg-navbar z-[210] shadow-2xl border-b border-border/10 overflow-y-auto max-h-[90vh]"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
              
              {/* Premium Search Input Section */}
              <div className="flex items-center gap-4 mb-10">
                <div className="flex-1 relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                    <Search size={24} strokeWidth={2.5} />
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSelect(query)}
                    placeholder="Search for premium delicacies..."
                    className="w-full bg-card/50 border-2 border-border/40 text-xl font-black text-heading pl-16 pr-12 py-5 rounded-3xl outline-none transition-all focus:border-primary/50 focus:bg-card focus:shadow-2xl shadow-inner placeholder:text-muted/30 uppercase tracking-tight"
                  />
                  {loading && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={onClose}
                  className="hidden sm:flex w-16 h-16 items-center justify-center rounded-3xl bg-primary/5 text-primary hover:bg-primary hover:text-button-text transition-all duration-300 border border-primary/10"
                >
                  <X size={28} />
                </button>
              </div>

              {/* Dynamic Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16">
                
                {/* Sidebar (Left on PC) */}
                <div className="lg:col-span-4 space-y-10 order-2 lg:order-1">
                  
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="bg-card/30 rounded-[2.5rem] p-8 border border-border/40">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <History size={18} className="text-primary/60" />
                          <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Recent</h3>
                        </div>
                        <button onClick={clearRecent} className="text-[10px] font-black text-primary/40 hover:text-primary uppercase tracking-widest transition-colors">Clear All</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => onSelect(s)}
                            className="px-4 py-2.5 bg-background border border-border/40 rounded-xl text-xs font-black uppercase tracking-wider text-heading hover:border-primary hover:text-primary transition-all flex items-center gap-2 group"
                          >
                            {s}
                            <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Categories */}
                  <div className="bg-card/30 rounded-[2.5rem] p-8 border border-border/40">
                    <div className="flex items-center gap-3 mb-8">
                      <TrendingUp size={18} className="text-accent" />
                      <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Trending Now</h3>
                    </div>
                    <div className="space-y-2">
                      {trending.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => onSelect(item)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 transition-all group"
                        >
                          <span className="text-sm font-black text-heading/70 group-hover:text-primary group-hover:pl-2 transition-all uppercase tracking-tight">{item}</span>
                          <Sparkles size={14} className="text-accent opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Results / Recommendations (Right on PC) */}
                <div className="lg:col-span-8 order-1 lg:order-2">
                  {query.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-border/20 pb-4 mb-4">
                        <h2 className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Matching Delicacies ({results.length})</h2>
                        {results.length > 0 && (
                          <button onClick={() => onSelect(query)} className="flex items-center gap-2 text-[10px] font-black text-muted hover:text-primary uppercase tracking-widest transition-all group">
                            View All Results <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        )}
                      </div>

                      {results.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {results.map((p) => (
                            <div 
                              key={p._id}
                              onClick={() => {
                                navigate(`/product/${p.slug}`);
                                onClose();
                              }}
                              className="flex items-center gap-5 p-5 bg-card rounded-3xl border border-border/40 hover:border-primary/30 cursor-pointer transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
                            >
                              <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden shadow-inner">
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-heading text-lg leading-tight truncate group-hover:text-primary transition-colors">{p.name}</p>
                                <p className="text-[10px] text-muted font-black uppercase tracking-[0.2em] mt-1">{p.category}</p>
                                <div className="flex items-center gap-3 mt-3">
                                  <span className="text-sm font-black text-primary uppercase">₹{p.offerPrice || p.price}</span>
                                  {p.offerPrice && <span className="text-[10px] line-through opacity-30">₹{p.price}</span>}
                                </div>
                              </div>
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight size={18} className="text-primary" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-24 text-center bg-card/20 rounded-[3rem] border-2 border-dashed border-border/40">
                          <Search size={48} className="mx-auto mb-6 text-muted/10" />
                          <p className="font-black text-heading uppercase tracking-tighter text-xl">No matching delicacies</p>
                          <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mt-4">Try different keywords or browse our shop</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center justify-between border-b border-border/20 pb-4">
                        <h2 className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Recommended For You</h2>
                        <Link to="/shop" onClick={onClose} className="flex items-center gap-2 text-[10px] font-black text-muted hover:text-primary uppercase tracking-widest transition-all group">
                          Browse Shop <ShoppingBag size={14} className="group-hover:scale-110 transition-transform" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {recommended.length > 0 ? (
                          recommended.map((p) => (
                            <div 
                              key={p._id}
                              onClick={() => {
                                navigate(`/product/${p.slug}`);
                                onClose();
                              }}
                              className="group cursor-pointer"
                            >
                              <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden shadow-2xl mb-4 border border-border/20">
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-footer/90 via-footer/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                <div className="absolute bottom-6 left-6 right-6">
                                  <span className="px-3 py-1 bg-primary text-button-text text-[9px] font-black uppercase tracking-widest rounded-lg mb-3 inline-block">Best Seller</span>
                                  <p className="text-lg font-black text-white leading-tight uppercase tracking-tight">{p.name}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                           Array(4).fill(0).map((_, i) => (
                             <div key={i} className="aspect-[16/10] rounded-[2.5rem] bg-muted/10 animate-pulse" />
                           ))
                        )}
                      </div>
                      
                      <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <Sparkles size={24} />
                          </div>
                          <div>
                            <p className="font-black text-heading uppercase tracking-tight">Need a custom masterpiece?</p>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">Direct from our master bakers</p>
                          </div>
                        </div>
                        <button onClick={() => { navigate('/custom-cake'); onClose(); }} className="px-8 py-3.5 bg-primary text-button-text rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 shadow-xl shadow-primary/20 transition-all">Design Your Cake</button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
