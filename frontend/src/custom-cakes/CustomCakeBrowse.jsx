import React, { useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Eye, Check, Layers, Search, ChevronDown, Star, ChevronRight, Settings2, Heart, List, LayoutGrid, SlidersHorizontal, X } from 'lucide-react';
import { TIERS } from './customCakeData';

// Premium Bolded Veg Icon 
const VegIcon = () => (
  <div className="w-3.5 h-3.5 md:w-4 md:h-4 border border-green-600 flex items-center justify-center bg-white p-[1px] rounded-sm shrink-0">
    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-600 shrink-0" />
  </div>
);

export default function CustomCakeBrowse({
  filteredThemes,
  loading,
  selectedTier,
  setSelectedTier,
  themeSearchFilter,
  setThemeSearchFilter,
  priceSortFilter,
  setPriceSortFilter,
  selectTheme,
  hideFilters = false,
  onToggleFilter,
  onToggleDesktopFilter
}) {
  const [mobileLayout, setMobileLayout] = useState('grid');
  const { isInWishlist, toggleWishlist } = useWishlist();

  // ── Filter Panel (desktop sidebar) ──
  const FilterPanel = () => (
    <div className="space-y-7">
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/80 mb-3">Tiers</h3>
        <div className="flex flex-col gap-2">
          <button onClick={() => setSelectedTier(null)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-[12px] font-bold transition-all flex items-center justify-between ${selectedTier === null
                ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                : 'bg-[var(--heading)]/5 text-[var(--heading)]/80 border border-[var(--heading)]/10 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
              }`}>
            <span>All Tiers</span>
            {selectedTier === null && <Check size={14} />}
          </button>
          {TIERS.map(tier => (
            <button key={tier.id} onClick={() => setSelectedTier(tier.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-[12px] font-bold transition-all flex items-center justify-between ${selectedTier === tier.id
                  ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                  : 'bg-[var(--heading)]/5 text-[var(--heading)]/80 border border-[var(--heading)]/10 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
                }`}>
              <span>{tier.shortName} <span className="text-[10px] font-normal opacity-80">({tier.layers} Layers)</span></span>
              {selectedTier === tier.id && <Check size={14} />}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--heading)]/80 mb-3">Sort By</h3>
        <div className="relative">
          <select
            value={priceSortFilter}
            onChange={(e) => setPriceSortFilter(e.target.value)}
            className="w-full appearance-none bg-[var(--heading)]/5 border border-[var(--heading)]/10 text-[var(--heading)] rounded-lg pl-3 pr-8 py-2.5 text-[12px] font-bold outline-none cursor-pointer"
          >
            <option value="">Default Sorting</option>
            <option value="asc">Price: Low to High</option>
            <option value="desc">Price: High to Low</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
        </div>
      </section>
    </div>
  );

  // ── Mobile Top Bar (only shown if not hiding filters) ──
  const MobileTopBar = () => (
    <div className="sm:hidden mb-4 flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input type="text" placeholder="Search themes..." value={themeSearchFilter}
          onChange={(e) => setThemeSearchFilter(e.target.value)}
          className="w-full bg-[var(--card)] border border-[var(--border)] text-[var(--heading)] rounded-lg py-2.5 pl-10 pr-9 text-sm font-medium focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
        />
        {themeSearchFilter && (
          <button onClick={() => setThemeSearchFilter('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--heading)]">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        <button onClick={onToggleFilter}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[12px] font-bold text-[var(--heading)] hover:border-[var(--primary)] transition-colors">
          <SlidersHorizontal size={14} /> Filter
        </button>

        {/* Sort dropdown */}
        <div className="relative flex-1">
          <select value={priceSortFilter} onChange={(e) => setPriceSortFilter(e.target.value)}
            className="w-full appearance-none bg-[var(--card)] border border-[var(--border)] text-[var(--heading)] rounded-lg pl-3 pr-7 py-2.5 text-[12px] font-bold outline-none cursor-pointer">
            <option value="">Default Sort</option>
            <option value="asc">Price ↑</option>
            <option value="desc">Price ↓</option>
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
        <button onClick={() => setSelectedTier(null)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${selectedTier === null
              ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
              : 'bg-[var(--card)] border border-[var(--border)] text-[var(--heading)]/80 hover:border-[var(--primary)]/40'
            }`}>
          All Tiers
        </button>
        {TIERS.map((tier) => (
          <button key={tier.id} onClick={() => setSelectedTier(tier.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${selectedTier === tier.id
                ? 'bg-[var(--primary)] text-[var(--button-text)] shadow-sm'
                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--heading)]/80 hover:border-[var(--primary)]/40'
              }`}>
            {tier.shortName}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Desktop Page Header ── */}
      <div className="hidden sm:block relative overflow-hidden rounded-2xl bg-[var(--footer)] p-6 sm:p-10 border border-white/5 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/8 via-transparent to-[var(--accent)]/8 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">Custom Cakes</h1>
            <p className="text-sm text-white/80 font-medium max-w-md">Choose your tier and theme to start configuring your dream cake.</p>
          </div>
          <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72 group">
                <input type="text" placeholder="Search themes..." value={themeSearchFilter}
                  onChange={(e) => setThemeSearchFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-12 pr-10 text-sm font-medium focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all backdrop-blur-md placeholder:text-white/40"
                />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
                {themeSearchFilter && (
                  <button onClick={() => setThemeSearchFilter('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                    <X size={16} />
                  </button>
                )}
              </div>
              {hideFilters && (
                <button
                  onClick={onToggleDesktopFilter}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
                >
                  <Filter size={16} /> Filters
                </button>
              )}
            </div>
            <span className="text-[11px] font-bold text-white/80 bg-white/5 px-4 py-1.5 rounded-lg border border-white/10">
              {filteredThemes.length} {filteredThemes.length === 1 ? 'Theme' : 'Themes'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Mobile Page Header ── */}
      <div className="sm:hidden flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0 text-left">
          <h1 className="text-xl font-black text-[var(--heading)] leading-none">Custom Cakes</h1>
          <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">Choose your tier and theme to start configuring.</p>
        </div>
        <span className="text-[10px] font-bold text-[var(--muted)] shrink-0">
          {filteredThemes.length} {filteredThemes.length === 1 ? 'theme' : 'themes'}
        </span>
      </div>

      <MobileTopBar />

      <div className="flex gap-6 lg:gap-8">
        {/* ── Desktop Sidebar Panel – hidden when filters are hidden ── */}
        {!hideFilters && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20"><FilterPanel /></div>
          </aside>
        )}

        {/* ── Main Catalog Display Window ── */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className={`grid ${mobileLayout === 'list' ? 'grid-cols-1' : 'grid-cols-2'} sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6`}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--card)] animate-pulse">
                  <div className="aspect-square bg-[var(--border)]/40" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 rounded-lg bg-[var(--border)]/50" />
                    <div className="h-3 w-full rounded-lg bg-[var(--border)]/30" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredThemes.length === 0 ? (
            <div className="text-center py-20 text-[var(--muted)] font-black uppercase tracking-widest bg-[var(--card)] border border-[var(--border)] rounded-xl">
              No themes match your filters.
            </div>
          ) : (
            <div className={`grid ${mobileLayout === 'list' ? 'grid-cols-1' : 'grid-cols-2'} sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6`}>
              <AnimatePresence mode="popLayout">
                {filteredThemes.map((t, i) => (
                  <motion.div
                    key={t.id} layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    onClick={() => selectTheme(i)}
                    className={mobileLayout === 'list' 
                      ? "flex flex-row p-3 sm:p-4 pb-8 gap-3 sm:gap-4 items-stretch cursor-pointer w-full border-b transition-colors min-w-0"
                      : "group w-full h-full min-w-0 flex flex-col justify-between cursor-pointer transition-all duration-200 p-3 sm:p-4 pb-8 rounded-xl"
                    }
                    style={{ background: 'var(--card)', border: mobileLayout === 'list' ? 'none' : '1px solid var(--border)', borderBottom: mobileLayout === 'list' ? '1px solid var(--border)' : '' }}
                  >
                    {mobileLayout === 'list' ? (
                      <>
                        <div className="flex flex-col flex-1 min-w-0 justify-between overflow-hidden">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                              <VegIcon />
                              {t.enabled && (
                                <div
                                  className="text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border shadow-sm"
                                  style={{ background: 'var(--badge-discount-bg)', color: 'var(--badge-discount-text)', borderColor: 'var(--badge-discount-border)' }}
                                >
                                  Available
                                </div>
                              )}
                            </div>

                            <h3 className="text-[14px] sm:text-[15px] font-bold leading-tight break-words capitalize" style={{ color: 'var(--heading)' }}>
                              {t.name}
                            </h3>

                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[14px] font-extrabold" style={{ color: 'var(--heading)' }}>₹{t.basePrice}</span>
                            </div>

                            <div className="flex items-center gap-0.5 mt-1 text-[11px] font-bold text-green-500">
                              <Star size={12} fill={(t.rating || 0) > 0 ? "currentColor" : "none"} strokeWidth={2.5} />
                              <span>{(t.rating || 0) > 0 ? (t.rating || 0).toFixed(1) : '0'}</span>
                              <span className="font-medium text-[10px] ml-1" style={{ color: 'var(--muted)' }}>
                                ({t.numReviews === 1 ? '1 review' : `${t.numReviews || 0} reviews`})
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 mt-2 pr-2">
                            {t.description && (
                              <div className="flex items-start gap-1 mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>
                                <span className="capitalize leading-snug line-clamp-2">{t.description}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="relative shrink-0 w-[104px] sm:w-28 md:w-36 aspect-square rounded-xl self-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <div className="w-full h-full overflow-hidden rounded-xl">
                            {t.image || t.flavors?.[0]?.image
                              ? <img src={t.image || t.flavors[0].image} alt={t.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                              : <span className="flex items-center justify-center h-full text-6xl">{t.emoji}</span>
                            }
                          </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); if(t._id || t.id) toggleWishlist(t._id || t.id, 'customCake'); }}
                            className={`touch-compact absolute top-1.5 right-1.5 flex items-center justify-center rounded-full shadow-md z-10 w-6 h-6 md:w-9 md:h-9 border`}
                            style={{
                              background: 'var(--card)',
                              borderColor: 'var(--border)',
                              boxShadow: '0 2px 8px rgba(var(--shadow-color), 0.08)'
                            }}
                          >
                            <Heart
                              className={`w-3 h-3 md:w-[16px] md:h-[16px]`}
                              fill={isInWishlist(t._id || t.id, 'customCake') ? '#ef4444' : 'none'}
                              strokeWidth={2.5}
                              style={{ color: isInWishlist(t._id || t.id, 'customCake') ? '#ef4444' : 'var(--heading)' }}
                            />
                          </button>

                          <div className="absolute -bottom-3.5 md:-bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-md p-[1.5px] overflow-hidden shadow-md">
                            <motion.div
                              className="absolute inset-0 w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_center,var(--accent)_0%,var(--secondary)_50%,transparent_100%)]"
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                              style={{ transformOrigin: 'center' }}
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); selectTheme(i); }}
                              className="touch-compact relative z-10 flex items-center justify-center rounded-[5px] h-6 w-6 md:h-9 md:w-[104px] text-[12px] md:text-[14px] font-extrabold tracking-wider cursor-pointer transition-transform active:scale-95"
                              style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }}
                              title="Customize Cake"
                            >
                              <Settings2 size={12} strokeWidth={3.5} className="md:w-[15px] md:h-[15px]" />
                              <span className="hidden md:inline ml-1">CUSTOMIZE</span>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                      <div className="relative aspect-square overflow-visible shrink-0 w-full mb-8" style={{ background: 'var(--surface)', borderRadius: '12px' }}>
                        <div className="w-full h-full overflow-hidden rounded-xl">
                          {t.image || t.flavors?.[0]?.image
                            ? <img src={t.image || t.flavors[0].image} alt={t.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                            : <span className="flex items-center justify-center h-full text-6xl">{t.emoji}</span>
                          }
                        </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); if(t._id || t.id) toggleWishlist(t._id || t.id, 'customCake'); }}
                            className={`touch-compact absolute top-1.5 right-1.5 flex items-center justify-center rounded-full shadow-md z-10 w-6 h-6 md:w-9 md:h-9 border`}
                            style={{
                              background: 'var(--card)',
                              borderColor: 'var(--border)',
                              boxShadow: '0 2px 8px rgba(var(--shadow-color), 0.08)'
                            }}
                          >
                            <Heart
                              className={`w-3 h-3 md:w-[16px] md:h-[16px]`}
                              fill={isInWishlist(t._id || t.id, 'customCake') ? '#ef4444' : 'none'}
                              strokeWidth={2.5}
                              style={{ color: isInWishlist(t._id || t.id, 'customCake') ? '#ef4444' : 'var(--heading)' }}
                            />
                          </button>

                        <div className="absolute -bottom-3.5 md:-bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-md p-[1.5px] overflow-hidden shadow-md">
                          <motion.div
                            className="absolute inset-0 w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_center,var(--accent)_0%,var(--secondary)_50%,transparent_100%)]"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                            style={{ transformOrigin: 'center' }}
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); selectTheme(i); }}
                            className="touch-compact relative z-10 flex items-center justify-center rounded-[5px] h-6 w-6 md:h-9 md:w-[104px] text-[12px] md:text-[14px] font-extrabold tracking-wider cursor-pointer transition-transform active:scale-95"
                            style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }}
                            title="Customize Cake"
                          >
                            <Settings2 size={12} strokeWidth={3.5} className="md:w-[15px] md:h-[15px]" />
                            <span className="hidden md:inline ml-1">CUSTOMIZE</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col text-left mt-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          <VegIcon />
                          {t.enabled && (
                            <div
                              className="text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border shadow-sm"
                              style={{ background: 'var(--badge-discount-bg)', color: 'var(--badge-discount-text)', borderColor: 'var(--badge-discount-border)' }}
                            >
                              Available
                            </div>
                          )}
                        </div>

                        <h3 className="text-[14px] md:text-[15px] font-bold leading-tight mb-1 break-words capitalize" style={{ color: 'var(--heading)' }}>
                          {t.name}
                        </h3>

                        <div className="flex items-center gap-1 text-[12px] font-medium mb-1 flex-wrap" style={{ color: 'var(--muted)' }}>
                          <div className="flex items-center gap-0.5 font-bold text-green-500">
                            <Star size={13} fill={(t.rating || 0) > 0 ? "currentColor" : "none"} strokeWidth={2.5} />
                            <span>{(t.rating || 0) > 0 ? (t.rating || 0).toFixed(1) : '0'}</span>
                            <span className="font-normal text-[11px] ml-0.5" style={{ color: 'var(--muted)' }}>
                              ({t.numReviews === 1 ? '1 review' : `${t.numReviews || 0} reviews`})
                            </span>
                          </div>
                          {t.description && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-0.5">
                                <span className="capitalize text-[11px] line-clamp-2 leading-snug">{t.description}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col text-left mt-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[15px] md:text-[17px] font-black" style={{ color: 'var(--heading)' }}>₹{t.basePrice}</span>
                      </div>
                    </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}