import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode, Pagination } from 'swiper/modules';
import {
  ArrowLeft, ArrowRight, Check, ShoppingCart, ChevronLeft, ChevronRight,
  Heart, ChevronDown, Settings2, Sparkles, RotateCcw, ShieldCheck, X
} from 'lucide-react';
import PureVegIcon from '../assets/pure veg.webp';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import ProductSimilar from '../product/components/ProductSimilar';

const VegIcon = () => (
  <img src={PureVegIcon} alt="Pure Veg" className="inline-block flex-shrink-0 w-5 h-5" style={{ marginTop: '-2px' }} />
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
  const [hasCustomized, setHasCustomized] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768 && (showMobileConfig || flavorDropdownOpen)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileConfig, flavorDropdownOpen]);

  // Priority check for mobile Add to Cart
  const onMobileAddToCart = () => {
    if (!customerName || !customerName.trim() || !hasCustomized) {
      setShowMobileConfig(true);
    } else {
      handleAddToCart();
    }
  };

  const prevColor = () => {
    if (!theme || !theme.flavors || theme.flavors.length <= 1) return;
    const currentIndex = theme.flavors.findIndex(f => f.id === selectedFlavor?.id);
    const prevIndex = (currentIndex - 1 + theme.flavors.length) % theme.flavors.length;
    setSelectedFlavor(theme.flavors[prevIndex]);
  };

  const nextColor = () => {
    if (!theme || !theme.flavors || theme.flavors.length <= 1) return;
    const currentIndex = theme.flavors.findIndex(f => f.id === selectedFlavor?.id);
    const nextIndex = (currentIndex + 1) % theme.flavors.length;
    setSelectedFlavor(theme.flavors[nextIndex]);
  };

  const renderPersonalizeForm = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5">
        <VegIcon />
        <span className="text-xs sm:text-sm font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
          100% Pure Veg & Eggless
        </span>
      </div>

      {/* ── DROPDOWN FLAVOUR SELECTION ── */}
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-bold text-[var(--muted)] uppercase tracking-wider">
          Inside Cake Flavour <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <select
            value={selectedDbFlavor?._id || ''}
            onChange={(e) => {
              const selected = theme?.dbFlavors?.find(f => f._id === e.target.value);
              if (selected) setSelectedDbFlavor(selected);
            }}
            className="w-full appearance-none bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer pr-10 font-bold"
          >
            {theme && theme.dbFlavors && theme.dbFlavors.map(flavor => {
              const weightVal = parseFloat(weight?.label || '1');
              const wObj = flavor.weights?.find(x => x.kg === weightVal);
              const priceVal = wObj ? wObj.price : (flavor.weights?.find(x => x.kg === 1)?.price || 1120);

              return (
                <option key={flavor._id} value={flavor._id} className="bg-[var(--card)] text-[var(--foreground)]">
                  {flavor.name} (+₹{priceVal})
                </option>
              );
            })}
          </select>
          <ChevronDown size={18} className="absolute right-3.5 top-3.5 text-[var(--muted)] pointer-events-none" />
        </div>
      </div>

      {/* ── CUSTOM CONFIGURATION INPUTS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[var(--muted)] mb-2 uppercase tracking-wider">
            Name on Cake <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text" maxLength={20}
              placeholder="e.g. 'Happy Birthday, name' or 'My Life'"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--muted)] rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary)] pr-14 transition-all font-bold"
            />
            <span className="absolute right-3.5 top-3.5 text-xs text-[var(--muted)] font-bold">{customerName.length}/20</span>
            <p className="mt-2 text-xs text-[var(--muted)]">Use this for the exact text to appear on cake — short names or titles (e.g. "Happy Birthday, name" or "My Life").</p>
          </div>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[var(--muted)] mb-2 uppercase tracking-wider">Age</label>
          <div className="relative">
            <select
              value={age}
              onChange={e => setAge(e.target.value)}
              className="w-full appearance-none bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer pr-10 font-bold"
            >
              {Array.from({ length: 100 }, (_, i) => i + 1).map(v => (
                <option key={v} value={v} className="bg-[var(--card)] text-[var(--foreground)]">{v} {v === 1 ? 'Yr' : 'Yrs'}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3.5 top-3.5 text-[var(--muted)] pointer-events-none" />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-bold text-[var(--muted)] mb-2 uppercase tracking-wider">
          Message on Cake <span className="text-[var(--muted)] font-normal normal-case">(Optional)</span>
        </label>
        <div className="relative">
          <input
            type="text" maxLength={60}
              placeholder="e.g. Less sugar, less cream — important notes"
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full bg-[var(--input)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--muted)] rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary)] pr-16 transition-all font-bold"
          />
          <span className="absolute right-3.5 top-3.5 text-xs text-[var(--muted)] font-bold">{message.length}/60</span>
            <p className="mt-2 text-xs text-[var(--muted)]">Add special requests or important notes (e.g., less sugar, less cream, allergy info, delivery instructions).</p>
        </div>
      </div>
    </div>
  );

  const renderConfigContent = () => (
    <div className="space-y-6">
      {/* Weight Selection */}
      {theme.enabled && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-sm sm:text-base text-[var(--heading)]">Select Cake Weight</p>
            <span className="text-xs sm:text-sm text-[var(--muted)] font-bold">Serves {weight.serves} people</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {WEIGHTS.map((w, i) => {
              const isSel = i === weightIdx;
              return (
                <button
                  key={w.label} onClick={() => setWeightIdx(i)}
                  className={`py-3 rounded-xl border-2 text-center transition-all ${isSel ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--background)] shadow-sm' : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]'}`}
                >
                  <div className="text-sm font-black">{w.label}</div>
                  <div className={`text-xs font-bold ${isSel ? 'text-[var(--background)] opacity-90' : 'text-[var(--muted)]'}`}>₹{getFlavorWeightPrice(w)}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Personalization Inputs */}
      {theme.enabled && (
        <div className="bg-[var(--card-soft)] border border-[var(--border)] p-5 rounded-2xl space-y-4">
          <p className="font-black text-sm sm:text-base text-[var(--heading)] border-b border-[var(--border)] pb-2.5">Custom Configuration Specifications</p>
          {renderPersonalizeForm()}
        </div>
      )}

      {/* Summary Box */}
      {theme.enabled && (
        <div className="bg-[var(--card-soft)] rounded-2xl border border-[var(--border)] p-5 space-y-3 text-sm sm:text-base text-[var(--foreground)]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)] font-medium">Base Cake & Flavour Weight Price</span>
            <span className="font-black text-[var(--heading)]">₹{basePrice}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)] font-medium">Tier & Structural Frame Pricing</span>
            <span className="font-black text-[var(--heading)]">+₹{tierPrice}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)] font-medium">Theme Color Modification Addon</span>
            <span className="font-black text-[var(--heading)]">+₹{themePrice}</span>
          </div>
          <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-4 text-base sm:text-lg font-black text-[var(--primary)]">
            <span>Grand Valuation Total:</span>
            <span>₹{grandTotal}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderColorCard = (flavor) => {
    const isSel = selectedFlavor?.id === flavor.id;
    return (
      <button
        key={flavor.id}
        type="button"
        onClick={() => setSelectedFlavor(flavor)}
        className={`group relative w-full overflow-hidden rounded-2xl border-2 transition-all duration-300 flex flex-col text-left ${
          isSel
            ? 'border-[var(--primary)] bg-[var(--card)] shadow-lg ring-2 ring-[var(--primary)]/20 scale-[1.02]'
            : 'border-[var(--border)] bg-[var(--card)]/60 hover:bg-[var(--card)] hover:border-[var(--primary)]/40 opacity-90 hover:opacity-100'
        }`}
      >
        <div
          className="relative aspect-square w-full overflow-hidden p-2.5"
          style={{ background: flavor.bg || 'var(--card-soft)' }}
        >
          <img
            src={flavor.image || theme.image || theme.flavors?.[0]?.image}
            alt={flavor.name}
            className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
          />
          {isSel && (
            <span className="absolute top-3.5 right-3.5 bg-[var(--primary)] text-[var(--background)] rounded-full p-1 shadow-md flex items-center justify-center z-10">
              <Check size={14} strokeWidth={3} />
            </span>
          )}
        </div>
        <div className="p-3 bg-[var(--card)] flex flex-col items-center text-center justify-between gap-0.5 border-t border-[var(--border)]/50">
          <p className="text-xs sm:text-sm font-black text-[var(--heading)] truncate w-full">{flavor.name}</p>
          <p className={`text-xs font-bold ${isSel ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}>
            +₹{flavor.price || 0}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full max-w-full mx-auto overflow-hidden rounded-none sm:rounded-[2rem] border-0 sm:border border-[var(--border)] bg-[var(--background)] px-4 sm:px-8 lg:px-12 xl:px-16 py-6 lg:py-10">
      <div className="pt-2 pb-4">
        <button onClick={goBackToBrowse} className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
          <ArrowLeft size={18} /> Back to All Themes
        </button>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pb-8">

        {/* ── LEFT COLUMN ── */}
        <div className="w-full lg:col-span-5">
          <div className="w-full space-y-5">
            <div
              className="relative aspect-[4/3] sm:aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[var(--border)]/50 shadow-premium group"
              style={{ background: theme.enabled ? (selectedFlavor?.bg || theme.bg) : theme.bg }}
            >
              {!theme.enabled && theme.image && <img src={theme.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />}
              {!theme.enabled && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[3px]">
                  <span className="text-6xl mb-3">{theme.emoji}</span>
                  <p className="text-[var(--heading)] font-black text-3xl">Coming Soon</p>
                </div>
              )}

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(theme.id, 'customCake')}
                className="touch-compact absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center justify-center rounded-full shadow-2xl bg-[var(--button-alt-bg)] border border-white/20 !w-11 !h-11 sm:!w-12 sm:!h-12 transition-transform hover:scale-105"
              >
                <Heart
                  size={22}
                  strokeWidth={2.5}
                  fill={isThemeWishlisted ? 'var(--primary)' : 'none'}
                  style={{ color: 'var(--primary)' }}
                />
              </button>

              {/* Navigation Arrows */}
              {theme.enabled && theme.flavors?.length > 1 && (
                <>
                  <button
                    onClick={prevColor}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--button-alt-bg)] text-[var(--heading)] shadow-2xl flex items-center justify-center border border-white/20 hover:border-[var(--primary)] hover:text-[var(--primary)] active:scale-95 transition-all"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    onClick={nextColor}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--button-alt-bg)] text-[var(--heading)] shadow-2xl flex items-center justify-center border border-white/20 hover:border-[var(--primary)] hover:text-[var(--primary)] active:scale-95 transition-all"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              <div className="w-full h-full">
                <AnimatePresence mode="wait">
                  {theme.enabled ? (
                    <motion.img
                      key={`${theme.id}-${selectedFlavor?.id}`}
                      src={selectedFlavor?.image || theme.image || theme.flavors?.[0]?.image}
                      alt={selectedFlavor?.name}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : <div className="w-full h-full" />}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Visual Outer Colors (Mobile Swiper + PC Grid) ── */}
            {theme.enabled && theme.flavors?.length > 0 && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-base sm:text-lg font-black text-[var(--heading)]">Choose Outer Visual Color</p>
                  <span className="text-xs sm:text-sm font-bold text-[var(--muted)] uppercase tracking-wider">{theme.flavors.length} Colors</span>
                </div>

                {/* Mobile Swiper (< md) */}
                <div className="block md:hidden">
                  <Swiper
                    modules={[FreeMode]}
                    freeMode
                    slidesPerView="auto"
                    spaceBetween={12}
                    className="w-full !py-1"
                  >
                    {theme.flavors.map((flavor) => (
                      <SwiperSlide key={flavor.id} className="!w-[135px] !flex-shrink-0">
                        {renderColorCard(flavor)}
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>

                {/* PC & Laptop Grid (>= md) */}
                <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  {theme.flavors.map((flavor) => renderColorCard(flavor))}
                </div>
              </div>
            )}

            {/* ── 3 BOTTOM FEATURE CARDS ── */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mt-5 sm:mt-6">
              {[
                { icon: Sparkles, label: 'Handcrafted', sub: 'Theme detail' },
                { icon: RotateCcw, label: 'Fresh Daily', sub: 'Made to order' },
                { icon: ShieldCheck, label: 'Secure Pay', sub: '100% safe' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-[var(--card)] rounded-xl sm:rounded-2xl border border-[var(--border)]/60 px-2 py-2.5 sm:p-3 flex flex-col items-center text-center gap-1 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <Icon size={20} className="text-[var(--primary)] shrink-0" />
                  <p className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[var(--heading)] leading-tight mt-0.5">{label}</p>
                  <p className="text-[10px] sm:text-[11px] text-[var(--muted)] font-medium leading-none">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="w-full lg:col-span-7 lg:sticky lg:top-24">
          <div className="bg-[var(--card)] sm:bg-transparent rounded-2xl sm:rounded-none border border-[var(--border)]/70 sm:border-0 p-5 sm:p-0 shadow-card sm:shadow-none space-y-6">
            <div>
              <h1 className="font-black text-3xl sm:text-4xl lg:text-5xl text-[var(--heading)] leading-tight">{theme.name} Cake</h1>

              <div className="mt-4">
                <span className="inline-block px-5 py-2.5 rounded-xl border border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-black uppercase tracking-wider shadow-sm">
                  {currentTier ? currentTier.shortName : 'Tier 1'} {currentTier ? `(${currentTier.layers} Layers)` : ''}
                </span>
              </div>

              <div className="custom-cake-price-row mt-5 flex items-baseline gap-3">
                <span className="text-sm sm:text-base text-[var(--muted)] font-bold">Total estimated value:</span>
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--heading)]">₹{theme.enabled ? grandTotal : '—'}</span>
              </div>
            </div>

            {/* ─── DESKTOP CONFIG ─── */}
            <div className="hidden md:block w-full">
              {renderConfigContent()}
            </div>

            {/* Mobile Configuration Summary */}
            {hasCustomized && (
              <div className="md:hidden mt-6 bg-[var(--card-soft)] border border-[var(--border)] rounded-2xl p-5 space-y-2.5 text-sm">
                <p className="font-black text-base text-[var(--heading)] border-b border-[var(--border)] pb-2 mb-2">Your Configuration</p>
                <div className="flex justify-between"><span>Outer Color</span><span className="font-bold">{selectedFlavor?.name || 'Standard'}</span></div>
                {selectedDbFlavor && <div className="flex justify-between"><span>Inside Flavor</span><span className="font-bold">{selectedDbFlavor.name}</span></div>}
                <div className="flex justify-between"><span>Weight</span><span className="font-bold">{weight?.label}</span></div>
                {customerName && <div className="flex justify-between"><span>Name</span><span className="font-bold">{customerName}</span></div>}
                {message && <div className="flex justify-between"><span>Message</span><span className="font-bold">{message}</span></div>}
                <div className="border-t border-[var(--border)] pt-2 mt-2 flex justify-between text-base font-black text-[var(--primary)]"><span>Total Price</span><span>₹{grandTotal}</span></div>
              </div>
            )}

            {/* Mobile Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-5 w-full md:hidden">
              <button
                type="button"
                onClick={onMobileAddToCart}
                disabled={isAdding}
                className="h-14 border-2 border-[var(--primary)] text-[var(--primary)] font-black text-xs rounded-xl flex items-center justify-center gap-1.5 bg-[var(--button-alt-bg)] active:scale-95 transition-all"
              >
                <ShoppingCart size={18} /> ADD TO CART
              </button>
              <button
                type="button"
                onClick={() => setShowMobileConfig(true)}
                className={`h-14 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all ${hasCustomized ? 'bg-[var(--button-alt-bg)] border-2 border-[var(--primary)]/40 text-[var(--button-alt-text)]' : 'bg-[var(--primary)] text-[var(--background)]'}`}
              >
                {hasCustomized ? <><Check size={16} className="text-[var(--primary)]" /> EDITED</> : <><Settings2 size={16} /> CUSTOMIZE</>}
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:grid grid-cols-2 gap-4 mt-4 w-full">
              <button onClick={handleAddToCart} disabled={isAdding} className="h-16 border-2 border-[var(--primary)] text-[var(--primary)] font-black text-sm rounded-xl flex items-center justify-center gap-2.5 hover:bg-[var(--primary)]/5 transition-colors bg-[var(--button-alt-bg)]">
                <ShoppingCart size={22} /> ADD TO CART
              </button>
              <button onClick={handleBuyNow} disabled={isAdding} className="h-16 bg-[var(--button-bg)] text-[var(--button-text)] font-black text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-lg hover:bg-[var(--button-hover)] transition-all">
                BUY NOW <ArrowRight size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Similar Cakes (Related) Carousel ── */}
      {Array.isArray(filteredThemes) && filteredThemes.length > 0 && (
        (() => {
          const related = filteredThemes
            .filter(t => t.id !== theme.id)
            .slice(0, 12)
            .map(t => ({
              _id: t.id,
              name: t.name,
              image: (t.flavors && t.flavors[0] && t.flavors[0].image) || t.image,
              price: t.basePrice || 0,
              category: ['Custom Cakes']
            }));

          return related.length ? <div className="mt-8"><ProductSimilar relatedProducts={related} /></div> : null;
        })()
      )}

      {/* ── MOBILE POP CARD MODAL FOR CUSTOMIZATION ── */}
      <AnimatePresence>
        {showMobileConfig && (
          <div className="md:hidden fixed inset-0 z-[9999] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
              onClick={() => setShowMobileConfig(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-[var(--background)] max-h-[85vh] rounded-t-3xl shadow-2xl p-6 pt-4 pb-safe z-10 flex flex-col"
            >
              <div className="w-14 h-1.5 bg-[var(--border)] rounded-full mx-auto mb-4" />

              <div className="sticky top-0 bg-[var(--background)] z-20 pb-4 mb-2 border-b border-[var(--border)] flex justify-between items-center">
                <h2 className="font-black text-xl text-[var(--heading)]">Customize Details</h2>
                <button onClick={() => setShowMobileConfig(false)} className="w-9 h-9 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full text-[var(--muted)] hover:text-[var(--heading)]">
                  <X size={18} />
                </button>
              </div>

              <div className={`flex-1 ${flavorDropdownOpen ? 'overflow-hidden' : 'overflow-y-auto'} pt-2 pb-6`}>
                {renderConfigContent()}
              </div>

              <div className="sticky bottom-0 bg-[var(--background)] pt-4 border-t border-[var(--border)]">
                <button
                  onClick={() => {
                    setShowMobileConfig(false);
                    setHasCustomized(true);
                  }}
                  className="w-full h-16 bg-[var(--primary)] text-[var(--background)] font-black text-base rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Check size={20} /> DONE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}