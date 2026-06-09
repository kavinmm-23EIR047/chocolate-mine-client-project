import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Star, Tag, Eye, CheckCircle2, XCircle, ShoppingBag, Plus, Minus,
  Ticket, Gift, Sparkles, ChevronDown, Truck, Flame, Crown, Zap,
  Shield, Clock, Package, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart, updateCartQty } from '../redux/slices/cartSlice';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';

const ImagePlaceholder = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-card-soft">
    <div className="w-8 h-8 border border-border/40 rounded-full flex items-center justify-center bg-card">
      <ShoppingBag className="w-3.5 h-3.5 text-muted" />
    </div>
    <span className="text-[8px] font-bold uppercase tracking-widest text-muted mt-1">Artisan</span>
  </div>
);

// Enhanced Badge Component with Neurophism & Gradient Animations
const ProductBadge = ({ type, value = "" }) => {
  // Base neurophism classes
  const neuroBase = "shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3),inset_-1px_-1px_2px_rgba(0,0,0,0.05),2px_2px_4px_rgba(0,0,0,0.1)]";
  
  if (type === 'veg') {
    return (
      <div title="Pure Veg" className="inline-flex items-center justify-center shrink-0 p-0.5 rounded-md bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),inset_-1px_-1px_2px_rgba(0,0,0,0.05),1px_1px_2px_rgba(0,0,0,0.1)]">
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="14" height="14" stroke="#008000" strokeWidth="2" />
          <circle cx="8" cy="8" r="4" fill="#008000" />
        </svg>
      </div>
    );
  }

  const badges = {
    bestseller: { 
      icon: <Flame size={9} className="animate-pulse" />, 
      text: "Bestseller", 
      gradient: "from-amber-400 to-orange-500",
      shadow: "shadow-amber-500/20",
      neuroBg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/30"
    },
    featured:   { 
      icon: <Crown size={9} />, 
      text: "Featured",   
      gradient: "from-purple-400 to-indigo-500",
      shadow: "shadow-purple-500/20",
      neuroBg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/30"
    },
    discount:   { 
      icon: <Zap size={9} className="animate-pulse" />,   
      text: `${value}% OFF`, 
      gradient: "from-red-400 to-rose-500",
      shadow: "shadow-red-500/20",
      neuroBg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/30"
    },
    new:        { 
      icon: <Sparkles size={9} className="animate-spin-slow" />, 
      text: "New",      
      gradient: "from-emerald-400 to-teal-500",
      shadow: "shadow-emerald-500/20",
      neuroBg: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/30"
    },
    limited:    { 
      icon: <Clock size={9} className="animate-pulse" />, 
      text: "Limited",     
      gradient: "from-orange-400 to-amber-500",
      shadow: "shadow-orange-500/20",
      neuroBg: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/30"
    },
    eggless:    { 
      icon: <CheckCircle2 size={9} />, 
      text: "Eggless", 
      gradient: "from-teal-400 to-cyan-500",
      shadow: "shadow-teal-500/20",
      neuroBg: "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/40 dark:to-teal-800/30"
    },
    premium:    { 
      icon: <TrendingUp size={9} />, 
      text: "Premium", 
      gradient: "from-indigo-400 to-violet-500",
      shadow: "shadow-indigo-500/20",
      neuroBg: "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/30"
    }
  };

  const badge = badges[type];
  if (!badge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
        text-[8px] font-black uppercase tracking-wider
        bg-gradient-to-r ${badge.gradient}
        text-white
        shadow-md ${badge.shadow}
        ${neuroBase}
        transition-all duration-300
        hover:shadow-lg hover:scale-105
      `}
    >
      <span className="drop-shadow-sm">{badge.icon}</span>
      <span className="drop-shadow-sm">{badge.text}</span>
    </motion.div>
  );
};

// Compact Coupon Card with Neurophism
const CouponCard = ({ coupon, onApply, onRemove, isApplied, onClose }) => {
  const neuroBg = isApplied 
    ? "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/30"
    : "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/30";
    
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      className={`relative rounded-xl overflow-hidden border-l-4 ${isApplied ? 'border-l-emerald-500' : 'border-l-amber-500'} ${neuroBg} shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),inset_-1px_-1px_2px_rgba(0,0,0,0.03),2px_2px_6px_rgba(0,0,0,0.08)]`}
    >
      <div className="p-1.5 sm:p-2">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center shrink-0 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),inset_-1px_-1px_2px_rgba(0,0,0,0.05)] ${isApplied ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
              {isApplied
                ? <CheckCircle2 size={9} className="text-emerald-600 dark:text-emerald-400" />
                : <Gift size={9} className="text-amber-600 dark:text-amber-400" />
              }
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[8px] font-mono font-black text-heading">{coupon.code}</span>
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow-[inset_1px_1px_1px_rgba(255,255,255,0.4),inset_-1px_-1px_1px_rgba(0,0,0,0.02)] ${isApplied ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'}`}>
                  {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                </span>
              </div>
              <p className="text-[7px] text-muted mt-0.5 truncate">{coupon.description || `Save on this product`}</p>
            </div>
          </div>

          {isApplied ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="text-[7px] font-bold text-muted hover:text-red-500 shrink-0 whitespace-nowrap transition-colors"
            >
              Remove
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onApply(); }}
              className="px-1.5 py-0.5 text-[7px] font-black rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Apply
            </button>
          )}
        </div>
      </div>

      {!isApplied && onClose && (
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-black/5">
          <XCircle size={8} className="text-muted" />
        </button>
      )}
    </motion.div>
  );
};

// Fixed Add to Cart Button with proper theme logic (Light = dark bg + light text, Dark = light bg + dark text)
const AddToCartBtn = ({ onClick, disabled, isOutOfStock, addingToCart, needsVariantSelection }) => {
  const label = needsVariantSelection
    ? 'Select Options'
    : addingToCart
      ? 'Adding…'
      : 'Add to Cart';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex-1 flex items-center justify-center gap-1.5 rounded-xl
        h-8 sm:h-9
        text-[9px] sm:text-[10px] font-black uppercase tracking-wide
        transition-all active:scale-95
        ${isOutOfStock
          ? 'bg-card-soft text-muted border border-border/50 cursor-not-allowed opacity-60'
          : `
            /* Light theme: dark background + light text */
            bg-gray-800 text-white
            hover:bg-gray-900
            /* Dark theme: light background + dark text */
            dark:bg-gray-100 dark:text-gray-900
            dark:hover:bg-gray-200
            shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.05),3px_3px_8px_rgba(0,0,0,0.15)]
            hover:shadow-[inset_2px_2px_3px_rgba(255,255,255,0.3),inset_-2px_-2px_3px_rgba(0,0,0,0.08),4px_4px_12px_rgba(0,0,0,0.2)]
          `
        }
      `}
    >
      <ShoppingBag size={12} className={`shrink-0 drop-shadow-sm ${
        isOutOfStock ? '' : 'light:text-white dark:text-gray-900'
      }`} />
      <span className="hidden sm:inline truncate">{label}</span>
    </button>
  );
};

// Enhanced Quick View Button
const QuickViewBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center justify-center gap-1 rounded-xl
      h-8 sm:h-9 shrink-0
      px-2 sm:px-3
      text-[8px] sm:text-[9px] font-bold uppercase tracking-wide
      border border-[var(--border)]
      /* Light theme: light background + dark text */
      bg-gray-100 text-gray-800 hover:bg-gray-200
      /* Dark theme: dark background + light text */
      dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700
      shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3),inset_-1px_-1px_2px_rgba(0,0,0,0.05),2px_2px_5px_rgba(0,0,0,0.1)]
      transition-all active:scale-95 whitespace-nowrap
    `}
  >
    <Eye size={12} className="shrink-0" />
    <span className="hidden sm:inline">Quick View</span>
  </button>
);

const ProductCard = ({ product, layout = 'vertical', cardStyle = 'rounded-lg' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);

  const cartItems = useSelector((state) => state.cart?.items || []);
  const currentCartItem = cartItems.find(item => item.product?._id === product._id || item._id === product._id);
  const cartQuantity = currentCartItem ? currentCartItem.qty : 0;
  const isLiked = isInWishlist(product._id);

  const cardStyles = {
    'rounded-sm': 'rounded-xl',
    'rounded-md': 'rounded-2xl',
    'rounded-lg': 'rounded-2xl',
    'rounded-xl': 'rounded-3xl',
    'soft':       'rounded-[32px_16px_32px_16px]',
    'pill':       'rounded-3xl'
  };

  const hasVariants = product.hasVariants || (product.variants && product.variants.length > 0);
  const needsVariantSelection = hasVariants && product.variants?.length > 1;
  const hasOffer = !hasVariants && product.offerPrice && product.offerPrice < product.price;
  const displayPrice = hasOffer ? product.offerPrice : product.price;
  const mrp = product.price;
  const discountPct = hasOffer ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  const coupon = product.coupon;
  const isCouponActive = coupon?.enabled && coupon?.code &&
    (!coupon.endDate || new Date(coupon.endDate) > new Date());
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  const handleApplyCoupon = () => {
    setIsCouponApplied(true);
    toast.success(`${coupon.code} applied!`);
    setShowCoupon(false);
  };

  const handleRemoveCoupon = () => {
    setIsCouponApplied(false);
    toast.success(`${coupon.code} removed`);
  };

  const finalPrice = isCouponApplied && isCouponActive
    ? coupon.type === 'percent'
      ? displayPrice - (displayPrice * coupon.value / 100)
      : Math.max(0, displayPrice - coupon.value)
    : displayPrice;

  const isOutOfStock = product.stock === false;
  const rating = Number(product.ratingsAverage) || 0;
  const reviewCount = Number(product.ratingsCount) || 0;

  const handleQuantityChange = (e, newQty) => {
    e.preventDefault();
    e.stopPropagation();
    if (newQty < 0) return;
    try {
      if (newQty === 0) {
        dispatch(removeFromCart(product._id));
        toast.success('Removed from bag');
      } else {
        dispatch(updateCartQty({ productId: product._id, qty: newQty }));
      }
    } catch (err) {
      toast.error('Could not update bag');
    }
  };

  const handleInitialAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    if (needsVariantSelection) {
      navigate(`/product/${product.slug}`);
      return;
    }
    try {
      setAddingToCart(true);
      dispatch(addToCart({
        product: product,
        qty: 1,
        options: hasVariants && product.variants
          ? { flavor: product.variants[0].flavor, weight: product.variants[0].weight }
          : null,
        variantPrice: hasVariants && product.variants ? product.variants[0].price : null
      }));
      toast.success('Added to bag');
    } catch (err) {
      toast.error('Failed to add');
    } finally {
      setTimeout(() => setAddingToCart(false), 300);
    }
  };

  const wish = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  const productName = product.name;
  const hasValidImage = product.image && product.image !== 'none' && product.image.trim() !== '';
  const isCakeCategory = String(product.category || '').toLowerCase().includes('cake');
  const displayCategory = product.category ? product.category.replace(/-/g, ' ') : 'Artisan Delight';

  // Enhanced Quantity Selector with Neurophism
  const QuantitySelector = () => (
    <div
      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--heading)] font-bold h-8 sm:h-9 w-full shadow-[inset_1px_1px_3px_rgba(255,255,255,0.4),inset_-1px_-1px_3px_rgba(0,0,0,0.05),2px_2px_6px_rgba(0,0,0,0.08)]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => handleQuantityChange(e, cartQuantity - 1)}
        className="h-full px-2.5 sm:px-3 hover:bg-[var(--card-soft)] active:scale-95 flex items-center justify-center border-r border-[var(--border)]/40 transition-colors rounded-l-xl"
      >
        <Minus size={10} />
      </button>
      <span className="text-[11px] px-1.5 font-black">{cartQuantity}</span>
      <button
        onClick={(e) => handleQuantityChange(e, cartQuantity + 1)}
        className="h-full px-2.5 sm:px-3 hover:bg-[var(--card-soft)] active:scale-95 flex items-center justify-center border-l border-[var(--border)]/40 transition-colors rounded-r-xl"
      >
        <Plus size={10} />
      </button>
    </div>
  );

  // ─── Horizontal Layout ───────────────────────────────────────────────────────
  if (layout === 'horizontal') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate(`/product/${product.slug}`)}
        className={`group flex flex-row p-2 sm:p-2.5 gap-2.5 sm:gap-3 cursor-pointer bg-[var(--card)] border border-[var(--border)]/50 hover:shadow-xl transition-all duration-300 w-full ${cardStyles[cardStyle]} shadow-[0_2px_8px_rgba(0,0,0,0.04)]`}
      >
        {/* Image */}
        <div className="relative w-[88px] h-[88px] sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)]/30 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.03)]">
          {hasValidImage
            ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
            : <ImagePlaceholder />
          }
          <button onClick={wish} className="absolute top-1 right-1 p-1 bg-[var(--card)]/80 backdrop-blur-sm rounded-full shadow-md hover:scale-110 transition-all z-10">
            <Heart size={10} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : 'text-[var(--muted)]'} />
          </button>
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
              <span className="text-[8px] font-black text-white bg-gradient-to-r from-red-500 to-rose-500 px-1.5 py-0.5 rounded-full shadow-lg">SOLD OUT</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
          <div className="space-y-0.5 sm:space-y-1">
            {/* Badges Row - Fixed equal size on mobile */}
            <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
              {isCakeCategory && <ProductBadge type="veg" />}
              {discountPct > 0 && <ProductBadge type="discount" value={discountPct} />}
              {product.bestseller && <ProductBadge type="bestseller" />}
              {product.featured && <ProductBadge type="featured" />}
              {product.eggless !== false && !isCakeCategory && <ProductBadge type="eggless" />}
            </div>
            <h3 className="text-[11px] sm:text-sm font-black text-[var(--heading)] leading-tight line-clamp-1 sm:line-clamp-2">{productName}</h3>
            <p className="text-[8px] text-[var(--muted)] line-clamp-1 sm:line-clamp-2 leading-relaxed hidden sm:block">
              {product.shortDescription || "Premium quality handcrafted product made with finest ingredients."}
            </p>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-sm font-black text-[var(--heading)]">₹{Math.round(finalPrice)}</span>
              {(hasOffer || isCouponApplied) && (
                <span className="text-[8px] font-bold text-[var(--muted)] line-through">₹{isCouponApplied ? displayPrice : mrp}</span>
              )}
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-0.5">
                <Star size={9} fill="#FBBF24" className="text-amber-400" />
                <span className="text-[8px] font-bold text-[var(--heading)]">{rating.toFixed(1)}</span>
                {reviewCount > 0 && <span className="text-[7px] text-[var(--muted)]">({reviewCount})</span>}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 mt-1 pt-1 border-t border-[var(--border)]/30">
            <QuickViewBtn onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.slug}`); }} />
            {cartQuantity > 0 && !needsVariantSelection ? (
              <div className="flex-1"><QuantitySelector /></div>
            ) : (
              <AddToCartBtn
                onClick={handleInitialAdd}
                disabled={isOutOfStock}
                isOutOfStock={isOutOfStock}
                addingToCart={addingToCart}
                needsVariantSelection={needsVariantSelection}
              />
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Vertical Layout ─────────────────────────────────────────────────────────
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/product/${product.slug}`)}
      className={`group h-full flex flex-col bg-[var(--card)] border border-[var(--border)]/50 hover:shadow-xl transition-all duration-300 overflow-hidden w-full ${cardStyles[cardStyle]} shadow-[0_2px_8px_rgba(0,0,0,0.04)]`}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] sm:aspect-[4/3] bg-[var(--surface)] overflow-hidden shrink-0">
        {hasValidImage
          ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          : <ImagePlaceholder />
        }
        <button
          onClick={wish}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 sm:p-2 bg-[var(--card)]/80 backdrop-blur-sm rounded-full shadow-md hover:scale-110 transition-all z-10"
        >
          <Heart size={12} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : 'text-[var(--muted)]'} />
        </button>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-1">
              <XCircle size={16} className="text-red-400" />
              <span className="text-[9px] font-black text-white bg-gradient-to-r from-red-500 to-rose-500 px-2 py-0.5 rounded-full shadow-lg">SOLD OUT</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2 sm:p-3 flex flex-col flex-1">
        <div className="flex flex-col gap-1 sm:gap-1.5">
          {/* Category + Delivery */}
          <div className="flex items-center justify-between">
            <span className="text-[7px] sm:text-[8px] text-[var(--muted)] font-black uppercase tracking-wider truncate max-w-[60%]">
              {displayCategory}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              <Truck size={8} className="text-[var(--muted)]" />
              <span className="text-[6px] sm:text-[7px] text-[var(--muted)] font-bold">Fast Delivery</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-[11px] sm:text-sm font-black text-[var(--heading)] leading-tight line-clamp-1 sm:line-clamp-2">
            {productName}
          </h3>

          {/* Short Description */}
          <p className="text-[8px] text-[var(--muted)] leading-relaxed line-clamp-1 hidden sm:block">
            {product.shortDescription || "Premium quality handcrafted product made with finest ingredients for your special moments."}
          </p>

          {/* Badges Row - Fixed equal size on mobile, no wrap */}
          <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
            {isCakeCategory && <ProductBadge type="veg" />}
            {!isCakeCategory && <ProductBadge type="eggless" />}
            {discountPct > 0 && <ProductBadge type="discount" value={discountPct} />}
            {product.bestseller && <ProductBadge type="bestseller" />}
            {product.featured && <ProductBadge type="featured" />}
            {product.limited && <ProductBadge type="limited" />}
            {product.premium && <ProductBadge type="premium" />}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-sm sm:text-lg font-black text-[var(--heading)]">₹{Math.round(finalPrice)}</span>
            {(hasOffer || isCouponApplied) && (
              <span className="text-[8px] font-bold text-[var(--muted)] line-through">₹{isCouponApplied ? displayPrice : mrp}</span>
            )}
            {discountPct > 0 && !isCouponApplied && (
              <span className="text-[7px] sm:text-[8px] font-black text-white bg-gradient-to-r from-red-500 to-rose-500 px-1.5 py-0.5 rounded-full shadow-md">
                -{discountPct}%
              </span>
            )}
          </div>

          {/* Rating + Stock */}
          <div className="flex items-center justify-between">
            {rating > 0 ? (
              <div className="flex items-center gap-0.5">
                <Star size={9} fill="#FBBF24" className="text-amber-400" />
                <span className="text-[8px] font-bold text-[var(--heading)]">{rating.toFixed(1)}</span>
                {reviewCount > 0 && <span className="text-[7px] text-[var(--muted)]">({reviewCount})</span>}
              </div>
            ) : <div />}
            {!isOutOfStock && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.3),inset_-1px_-1px_1px_rgba(0,0,0,0.02)]">
                <CheckCircle2 size={7} className="text-emerald-500" />
                <span className="text-[6px] sm:text-[7px] font-black text-emerald-600 dark:text-emerald-400">In Stock</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto pt-1.5 sm:pt-2 flex flex-col gap-1 sm:gap-1.5">
          {/* Coupon Section */}
          {isCouponActive && (
            <div>
              {isCouponApplied ? (
                <CouponCard coupon={coupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} isApplied={true} />
              ) : showCoupon ? (
                <CouponCard coupon={coupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} isApplied={false} onClose={() => setShowCoupon(false)} />
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCoupon(true); }}
                  className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-all shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3),inset_-1px_-1px_2px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center gap-1.5">
                    <Ticket size={9} className="text-amber-500 shrink-0" />
                    <span className="text-[8px] font-black text-amber-600 dark:text-amber-400">Coupon Available</span>
                  </div>
                  <ChevronDown size={9} className="text-amber-500 shrink-0" />
                </button>
              )}
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center gap-1 sm:gap-1.5 w-full">
            <QuickViewBtn onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.slug}`); }} />

            {cartQuantity > 0 && !needsVariantSelection ? (
              <div className="flex-1"><QuantitySelector /></div>
            ) : (
              <AddToCartBtn
                onClick={handleInitialAdd}
                disabled={isOutOfStock}
                isOutOfStock={isOutOfStock}
                addingToCart={addingToCart}
                needsVariantSelection={needsVariantSelection}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
