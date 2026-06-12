import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import {
  ArrowLeft, ArrowRight, Check, ShoppingCart, ChevronLeft, ChevronRight,
  Star, Heart, ChevronDown, Settings2, Search
} from 'lucide-react';
import PureVegIcon from '../assets/pure veg.webp';
import 'swiper/css';
import 'swiper/css/free-mode';

const VegIcon = () => (
  <img src={PureVegIcon} alt="Pure Veg" className="inline-block flex-shrink-0 w-4 h-4" style={{ marginTop: '-1px' }} />
);

export default function CustomCakeDetail({
  theme,
  currentTier,
  selectedTier,
  filteredThemes,
  selectedFlavor,
  setSelectedFlavor,
  selectedDbFlavor,
  setSelectedDbFlavor,
  weight,
  weightIdx,
  setWeightIdx,
  customerName,
  setCustomerName,
  age,
  setAge,
  message,
  setMessage,
  isAdding,
  flavorDropdownOpen,
  setFlavorDropdownOpen,
  flavorSearch,
  setFlavorSearch,
  showMobileConfig,
  setShowMobileConfig,
  configRef,
  getFlavorWeightPrice,
  basePrice,
  themePrice,
  tierPrice,
  grandTotal,
  handleAddToCart,
  handleBuyNow,
  goBackToBrowse,
  prevTheme,
  nextTheme,
  selectTheme,
  isThemeWishlisted,
  toggleWishlist,
  WEIGHTS
}) {

  const renderPersonalizeForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
        <VegIcon />
        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">100% Pure Veg & Eggless</span>
      </div>

      {/* ── DOMINO'S STYLE SEARCHABLE FLAVOUR DROPDOWN ── */}
      <div className="relative z-40">
        <label className="block text-xs font-bold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
          Inside Cake Flavour <span className="text-red-500">*</span>
        </label>

        <button
          type="button"
          onClick={() => setFlavorDropdownOpen(!flavorDropdownOpen)}
          className={`w-full bg-[var(--card)] border-2 ${flavorDropdownOpen ? 'border-[var(--primary)]' : 'border-[var(--border)]'} text-[var(--foreground)] rounded-xl px-4 py-3.5 text-sm focus:outline-none flex items-center justify-between transition-all font-black shadow-sm`}
        >
          {selectedDbFlavor ? (
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wide leading-none mb-1">Selected</span>
              <span className="leading-none">{selectedDbFlavor.name}</span>
            </div>
          ) : (
            <span className="text-[var(--muted)] font-bold">Select a flavour...</span>
          )}
          <ChevronDown size={18} className={`transition-transform duration-200 text-[var(--primary)] ${flavorDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {flavorDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/0" onClick={() => setFlavorDropdownOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 mt-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[320px] flex flex-col"
              >
                <div className="p-3 border-b border-[var(--border)] bg-[var(--background)] flex-shrink-0 relative z-50">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="text"
                      placeholder="Search flavours..."
                      value={flavorSearch}
                      onChange={(e) => setFlavorSearch(e.target.value)}
                      className="w-full bg-[var(--input)] border border-[var(--input-border)] pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[var(--primary)] font-bold text-[var(--foreground)] transition-all"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 relative z-50 pb-2">
                  {theme && Array.from(new Set(theme.dbFlavors.map(f => f.category))).map(category => {
                    const categoryFlavors = theme.dbFlavors.filter(
                      f => f.category === category && f.name.toLowerCase().includes(flavorSearch.toLowerCase())
                    );
                    if (categoryFlavors.length === 0) return null;

                    return (
                      <div key={category} className="mt-2">
                        <div className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider px-4 py-1.5 select-none bg-[var(--card-soft)]">
                          {category}
                        </div>
                        <div className="px-2 pt-1 space-y-1">
                          {categoryFlavors.map(flavor => {
                            const isSelected = selectedDbFlavor?._id === flavor._id;
                            return (
                              <button
                                key={flavor._id}
                                type="button"
                                onClick={() => {
                                  setSelectedDbFlavor(flavor);
                                  setFlavorDropdownOpen(false);
                                  setFlavorSearch('');
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between font-bold transition-all ${isSelected
                                  ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20'
                                  : 'hover:bg-[var(--input-hover)] text-[var(--foreground)] border border-transparent'
                                  }`}
                              >
                                <span>{flavor.name}</span>
                                <span className="flex items-center gap-2">
                                  <span className={`text-[11px] font-bold ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}>
                                    +₹{(() => {
                                      const weightVal = parseFloat(weight.label);
                                      const wObj = flavor.weights?.find(x => x.kg === weightVal);
                                      if (wObj) return wObj.price;
                                      const base = flavor.weights?.find(x => x.kg === 1);
                                      return base ? base.price : 1120;
                                    })()}
                                  </span>
                                  {isSelected && <Check size={16} className="text-[var(--primary)]" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── CUSTOM CONFIGURATION INPUTS ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
            Name on Cake <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text" maxLength={20}
              placeholder="e.g. Kavin"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] pr-12 transition-all font-bold"
            />
            <span className="absolute right-3 top-2.5 text-[10px] text-[var(--muted)] font-bold">{customerName.length}/20</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--muted)] mb-1.5 uppercase tracking-wider">Age</label>
          <div className="relative">
            <select
              value={age}
              onChange={e => setAge(e.target.value)}
              className="w-full appearance-none bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer pr-8 font-bold"
            >
              {Array.from({ length: 100 }, (_, i) => i + 1).map(v => (
                <option key={v} value={v}>{v} {v === 1 ? 'Yr' : 'Yrs'}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-3 text-[var(--muted)] pointer-events-none" />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
          Message on Cake <span className="text-[var(--muted)] font-normal normal-case">(Optional)</span>
        </label>
        <div className="relative">
          <input
            type="text" maxLength={60}
            placeholder="Happy Birthday!"
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] pr-14 transition-all font-bold"
          />
          <span className="absolute right-3 top-2.5 text-[10px] text-[var(--muted)] font-bold">{message.length}/60</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <button onClick={goBackToBrowse} className="flex items-center gap-2 mb-6 text-sm font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
        <ArrowLeft size={16} /> Back to All Themes
      </button>

      {/* Optimized Desktop Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">

        {/* ── LEFT COLUMN: Framing Media (Occupies 5 columns on laptop/desktop) ── */}
        <div className="lg:col-span-5 w-full lg:sticky lg:top-6">
          <div className="w-full space-y-5">
            <div
              className="relative aspect-[4/5] sm:aspect-[3/4] w-full rounded-3xl overflow-hidden border border-[var(--border)] shadow-sm"
              style={{ background: theme.enabled ? (selectedFlavor?.bg || theme.bg) : theme.bg }}
            >
              {!theme.enabled && theme.image && <img src={theme.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />}
              {!theme.enabled && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[3px]">
                  <span className="text-5xl mb-3">{theme.emoji}</span>
                  <p className="text-white font-black text-2xl">Coming Soon</p>
                </div>
              )}

              {/* Wishlist Button with Override Fixes */}
              <button
                onClick={() => toggleWishlist(theme.id, 'customCake')}
                className="touch-compact absolute top-4 right-4 z-20 flex items-center justify-center rounded-full shadow-lg border !w-10 !h-10 !min-w-0 !min-h-0 transition-transform hover:scale-105"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <Heart
                  size={20}
                  strokeWidth={2.5}
                  fill={isThemeWishlisted ? 'var(--primary)' : 'none'}
                  style={{ color: isThemeWishlisted ? 'var(--primary)' : 'var(--primary)' }}
                />
              </button>

              <button onClick={prevTheme} className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[var(--card)] text-[var(--heading)] shadow flex items-center justify-center border border-[var(--border)]"><ChevronLeft size={20} /></button>
              <button onClick={nextTheme} className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[var(--card)] text-[var(--heading)] shadow flex items-center justify-center border border-[var(--border)]"><ChevronRight size={20} /></button>

              <div className="w-full h-full">
                <AnimatePresence mode="wait">
                  {theme.enabled ? (
                    <motion.img
                      key={`${theme.id}-${selectedFlavor?.id}`}
                      src={selectedFlavor?.image || theme.image || theme.flavors?.[0]?.image}
                      alt={selectedFlavor?.name}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="w-full h-full object-cover"
                    />
                  ) : <div className="w-full h-full" />}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Visual Color Swiper ── */}
            {theme.enabled && theme.flavors.length > 0 && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs lg:text-sm font-black text-[var(--heading)]">Choose Outer Visual Color</p>
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">{theme.flavors.length} Colors</span>
                </div>
                <Swiper
                  modules={[FreeMode]}
                  freeMode
                  slidesPerView="auto"
                  spaceBetween={8}
                  className="!overflow-visible"
                >
                  {theme.flavors.map(flavor => {
                    const isSel = selectedFlavor?.id === flavor.id;
                    return (
                      <SwiperSlide key={flavor.id} style={{ width: 'auto' }}>
                        <button
                          onClick={() => setSelectedFlavor(flavor)}
                          className={`relative w-[85px] lg:w-[90px] flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${isSel ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-[var(--border)]'}`}
                          style={{ background: flavor.bg }}
                        >
                          <div className="aspect-square">
                            <img src={flavor.image || theme.image || theme.flavors?.[0]?.image} alt={flavor.name} className="w-full h-full object-cover" />
                          </div>
                          {isSel && <span className="absolute top-1 right-1 bg-[var(--primary)] text-[var(--background)] rounded-full p-0.5"><Check size={8} /></span>}
                          <div className="px-1.5 py-1.5 text-center bg-[var(--card)]" >
                            <p className="text-[9px] font-black text-[var(--heading)] truncate leading-tight">{flavor.name}</p>
                            <p className={`text-[9px] font-bold ${isSel ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}>+₹{flavor.price || 0}</p>
                          </div>
                        </button>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Configuration Forms (Occupies 7 columns on laptop/desktop) ── */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          <div>
            <h1 className="font-black text-2xl lg:text-3xl xl:text-4xl text-[var(--heading)] leading-tight">{theme.name} Cake</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="text-[var(--star)] fill-[var(--star)]" />)}</div>
              <span className="text-xs text-[var(--muted)]">({theme.reviews} reviews)</span>
            </div>

            <div className="mt-4">
              <span className="inline-block px-4 py-2 rounded-xl border border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-black uppercase tracking-wider shadow-sm">
                {currentTier ? currentTier.shortName : 'Tier 1'} {currentTier ? `(${currentTier.layers} Layers)` : ''}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-xs text-[var(--muted)] font-bold">Total estimated value:</span>
              <span className="text-2xl lg:text-3xl font-black text-[var(--heading)]">₹{theme.enabled ? grandTotal : '—'}</span>
            </div>
          </div>

          {/* ─── MOBILE COLLAPSIBLE & DESKTOP CONFIG ─── */}
          <div ref={configRef} className="w-full">
            <div className={`${showMobileConfig ? 'block' : 'hidden'} md:block space-y-6`}>
              {/* Weight Selection */}
              {theme.enabled && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="font-black text-sm text-[var(--heading)]">Select Cake Weight</p>
                    <span className="text-xs text-[var(--muted)] font-bold">Serves {weight.serves} people</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {WEIGHTS.map((w, i) => {
                      const isSel = i === weightIdx;
                      return (
                        <button
                          key={w.label} onClick={() => setWeightIdx(i)}
                          className={`py-2.5 rounded-xl border-2 text-center text-xs font-black transition-all ${isSel ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--background)] shadow-sm' : 'border-[var(--border)] bg-[var(--card)] text-[var(--heading)]'}`}
                        >
                          <div>{w.label}</div>
                          <div className={`text-[9px] font-bold ${isSel ? 'text-[var(--background)] opacity-90' : 'text-[var(--muted)]'}`}>₹{getFlavorWeightPrice(w)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Personalization Inputs */}
              {theme.enabled && (
                <div className="bg-[var(--card-soft)] border border-[var(--border)] p-4 lg:p-5 rounded-2xl space-y-4">
                  <p className="font-black text-sm text-[var(--heading)] border-b border-[var(--border)] pb-2">Custom Configuration Specifications</p>
                  {renderPersonalizeForm()}
                </div>
              )}

              {/* Summary Box */}
              {theme.enabled && (
                <div className="bg-[var(--card-soft)] rounded-2xl border border-[var(--border)] p-4 space-y-2 text-xs">
                  <div className="flex justify-between"><span>Base Cake & Flavour Weight Price</span><span className="font-bold">₹{basePrice}</span></div>
                  <div className="flex justify-between"><span>Tier & Structural Frame Pricing</span><span className="font-bold">+₹{tierPrice}</span></div>
                  <div className="flex justify-between"><span>Theme Color Modification Addon</span><span className="font-bold">+₹{themePrice}</span></div>
                  <div className="border-t border-[var(--border)] pt-2 flex justify-between text-sm font-black text-[var(--primary)]"><span>Grand Valuation Total:</span><span>₹{grandTotal}</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop/Laptop Action Buttons */}
          <div className="hidden md:grid grid-cols-2 gap-3 mt-2 w-full">
            <button onClick={handleAddToCart} disabled={isAdding} className="h-14 border-2 border-[var(--primary)] text-[var(--primary)] font-black text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--primary)]/5 transition-colors">
              <ShoppingCart size={18} /> ADD TO CART
            </button>
            <button onClick={handleBuyNow} disabled={isAdding} className="h-14 bg-[var(--secondary)] text-[var(--button-text)] font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all">
              BUY NOW <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Related Themes Swiper ── */}
      {filteredThemes.length > 1 && (
        <div className="mt-14 border-t border-[var(--border)] pt-10">
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-lg text-[var(--heading)]">Related Themes</p>
            <button onClick={goBackToBrowse} className="text-xs font-black text-[var(--primary)] uppercase tracking-wider hover:underline">View All</button>
          </div>
          <Swiper
            modules={[FreeMode]}
            freeMode
            slidesPerView="auto"
            spaceBetween={12}
            className="!overflow-visible"
          >
            {filteredThemes.filter(t => t.id !== theme.id).map((t, i) => (
              <SwiperSlide key={t.id} style={{ width: '160px' }}>
                <button
                  onClick={() => selectTheme(filteredThemes.findIndex(ft => ft.id === t.id))}
                  className="w-full rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--card)] hover:border-[var(--primary)] transition-all text-left"
                >
                  <div className="aspect-square overflow-hidden" style={{ background: t.bg }}>
                    {t.image || t.flavors?.[0]?.image
                      ? <img src={t.image || t.flavors[0].image} alt={t.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl">{t.emoji}</div>
                    }
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-black text-[var(--heading)] truncate">{t.name}</p>
                    <p className="text-[10px] font-bold text-[var(--primary)] mt-0.5">From ₹{t.basePrice}</p>
                  </div>
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* ── FIXED FLOATING MOBILE ACTIONS ── */}
      {theme && theme.enabled && (
        <div className="md:hidden fixed bottom-24 left-4 right-4 z-40 bg-[var(--card)]/95 backdrop-blur-md border border-[var(--border)] p-3 rounded-2xl shadow-2xl flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="flex-1 h-12 border-2 border-[var(--primary)] text-[var(--primary)] font-black text-xs rounded-xl flex items-center justify-center gap-2 bg-[var(--card)]"
          >
            <ShoppingCart size={16} /> CART
          </button>
          <button
            onClick={() => {
              if (showMobileConfig) {
                handleBuyNow();
              } else {
                setShowMobileConfig(true);
                setTimeout(() => configRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
              }
            }}
            disabled={isAdding}
            className={`flex-1 h-12 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all ${showMobileConfig ? 'bg-[var(--primary)] text-[var(--background)]' : 'bg-[var(--secondary)] text-[var(--button-text)]'} shadow-xl`}
          >
            {showMobileConfig ? <><Check size={16} /> {isAdding ? 'SAVING...' : 'DONE'}</> : <><Settings2 size={16} /> CUSTOMIZE</>}
          </button>
        </div>
      )}

    </div>
  );
}