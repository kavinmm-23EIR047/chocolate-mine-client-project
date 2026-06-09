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
    <div className="w-10 h-10 border border-border/40 rounded-full flex items-center justify-center bg-card">
      <ShoppingBag className="w-4 h-4 text-muted" />
    </div>
    <span className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">Artisan</span>
  </div>
);

// Badge Component
const ProductBadge = ({ type, value = "" }) => {
  if (type === 'veg') {
    return (
      <div title="Pure Veg" className="inline-flex items-center justify-center shrink-0">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="14" height="14" stroke="#008000" strokeWidth="2" />
          <circle cx="8" cy="8" r="4" fill="#008000" />
        </svg>
      </div>
    );
  }

  const badges = {
    bestseller: { icon: <Flame size={9} />, text: "Bestseller", color: "amber" },
    featured:   { icon: <Crown size={9} />, text: "Featured",   color: "purple" },
    discount:   { icon: <Zap size={9} />,   text: `${value}% OFF`, color: "red" },
    new:        { icon: <Sparkles size={9} />, text: "New",      color: "emerald" },
    limited:    { icon: <Clock size={9} />, text: "Limited",     color: "orange" },
    eggless:    { icon: <CheckCircle2 size={9} />, text: "Eggless", color: "teal" },
    premium:    { icon: <TrendingUp size={9} />, text: "Premium", color: "indigo" }
  };

  const badge = badges[type];
  if (!badge) return null;

  const colorClasses = {
    amber:   "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400",
    purple:  "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400",
    red:     "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400",
    orange:  "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400",
    teal:    "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:bg-teal-500/20 dark:text-teal-400",
    indigo:  "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400"
  };

  return (
    <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${colorClasses[badge.color]}`}>
      {badge.icon}
      <span>{badge.text}</span>
    </div>
  );
};

// Compact Coupon Card
const CouponCard = ({ coupon, onApply, onRemove, isApplied, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`relative rounded-lg overflow-hidden border-l-4 ${isApplied ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-amber-500 bg-amber-500/5'}`}
    >
      <div className="p-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isApplied ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
              {isApplied
                ? <CheckCircle2 size={10} className="text-emerald-500" />
                : <Gift size={10} className="text-amber-500" />
              }
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[9px] font-mono font-bold text-heading">{coupon.code}</span>
                <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${isApplied ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                  {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                </span>
              </div>
              <p className="text-[7px] text-muted mt-0.5 truncate">{coupon.description || `Save on this product`}</p>
            </div>
          </div>

          {isApplied ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="text-[8px] font-medium text-muted hover:text-red-500 shrink-0 whitespace-nowrap"
            >
              Remove
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onApply(); }}
              className="px-2 py-1 text-[8px] font-bold rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors shrink-0"
            >
              Apply
            </button>
          )}
        </div>
      </div>

      {!isApplied && onClose && (
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-1 right-1">
          <XCircle size={10} className="text-muted" />
        </button>
      )}
    </motion.div>
  );
};

// ─── Theme-aware Add to Cart Button ──────────────────────────────────────────
// Light theme: dark bg (#4E2820) + light text (#F2E2DB)  → matches --button-bg / --button-text
// Dark theme:  light bg (#E8D3CB) + dark text (#120806)  → matches dark --button-bg / --button-text
// On mobile (< sm) shows icon only; on sm+ shows icon + text
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
        flex-1 flex items-center justify-center gap-1.5 rounded-xl h-9
        text-[10px] font-black uppercase tracking-wide
        transition-all active:scale-95
        ${isOutOfStock
          ? 'bg-card-soft text-muted border border-border/50 cursor-not-allowed opacity-60'
          : `
            bg-[var(--button-bg)] text-[var(--button-text)]
            hover:bg-[var(--button-hover)]
            shadow-[var(--nm-button)]
            hover:shadow-[var(--nm-extruded)]
          `
        }
      `}
    >
      <ShoppingBag size={14} className="shrink-0" />
      {/* Text: hidden on mobile, shown sm+ */}
      <span className="hidden sm:inline truncate">{label}</span>
    </button>
  );
};

// ─── Theme-aware Quick View Button ───────────────────────────────────────────
// Uses secondary/alt button style: bg-card with border, muted text
// On mobile shows icon only; sm+ shows icon + text
const QuickViewBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center justify-center gap-1 rounded-xl h-9 shrink-0
      px-2 sm:px-3
      text-[9px] font-bold uppercase tracking-wide
      border border-[var(--border)]
      bg-[var(--button-alt-bg)] text-[var(--button-alt-text)]
      hover:bg-[var(--button-alt-hover)]
      shadow-[var(--nm-button)]
      transition-all whitespace-nowrap
    `}
  >
    <Eye size={13} className="shrink-0" />
    {/* Text: hidden on mobile, shown sm+ */}
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

  // Quantity selector — themed, full width
  const QuantitySelector = () => (
    <div
      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--heading)] font-bold h-9 w-full shadow-[var(--nm-sunken)]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => handleQuantityChange(e, cartQuantity - 1)}
        className="h-full px-3 hover:bg-[var(--card-soft)] active:scale-95 flex items-center justify-center border-r border-[var(--border)]/40 transition-colors rounded-l-xl"
      >
        <Minus size={11} />
      </button>
      <span className="text-[12px] px-2 font-black">{cartQuantity}</span>
      <button
        onClick={(e) => handleQuantityChange(e, cartQuantity + 1)}
        className="h-full px-3 hover:bg-[var(--card-soft)] active:scale-95 flex items-center justify-center border-l border-[var(--border)]/40 transition-colors rounded-r-xl"
      >
        <Plus size={11} />
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
        className={`group flex flex-row p-2.5 gap-3 cursor-pointer bg-[var(--card)] border border-[var(--border)]/50 hover:shadow-lg transition-all duration-300 w-full ${cardStyles[cardStyle]}`}
      >
        {/* Image */}
        <div className="relative w-20 h-20 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)]/30">
          {hasValidImage
            ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
            : <ImagePlaceholder />
          }
          <button onClick={wish} className="absolute top-1 right-1 p-1 bg-[var(--card)]/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-all z-10">
            <Heart size={11} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : 'text-[var(--muted)]'} />
          </button>
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-[9px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-full">SOLD OUT</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1">
              {isCakeCategory && <ProductBadge type="veg" />}
              {discountPct > 0 && <ProductBadge type="discount" value={discountPct} />}
              {product.bestseller && <ProductBadge type="bestseller" />}
              {product.featured && <ProductBadge type="featured" />}
            </div>
            <h3 className="text-xs sm:text-sm font-black text-[var(--heading)] leading-tight line-clamp-2">{productName}</h3>
            <p className="text-[9px] text-[var(--muted)] line-clamp-2 leading-relaxed hidden sm:block">
              {product.shortDescription || "Premium quality handcrafted product made with finest ingredients."}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-[var(--heading)]">₹{Math.round(finalPrice)}</span>
              {(hasOffer || isCouponApplied) && (
                <span className="text-[9px] font-bold text-[var(--muted)] line-through">₹{isCouponApplied ? displayPrice : mrp}</span>
              )}
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={10} fill="#FBBF24" className="text-amber-400" />
                <span className="text-[9px] font-bold text-[var(--heading)]">{rating.toFixed(1)}</span>
                {reviewCount > 0 && <span className="text-[8px] text-[var(--muted)]">({reviewCount})</span>}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-[var(--border)]/30">
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
      className={`group h-full flex flex-col bg-[var(--card)] border border-[var(--border)]/50 hover:shadow-lg transition-all duration-300 overflow-hidden w-full ${cardStyles[cardStyle]}`}
    >
      {/* Image — shorter aspect on mobile */}
      <div className="relative aspect-[4/3] sm:aspect-square bg-[var(--surface)] overflow-hidden shrink-0">
        {hasValidImage
          ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          : <ImagePlaceholder />
        }
        <button
          onClick={wish}
          className="absolute top-1.5 right-1.5 p-1.5 bg-[var(--card)]/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-all z-10"
        >
          <Heart size={13} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : 'text-[var(--muted)]'} />
        </button>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-1">
              <XCircle size={20} className="text-red-400" />
              <span className="text-[10px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full">SOLD OUT</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2 sm:p-3 flex flex-col flex-1">

        <div className="flex flex-col gap-1 sm:gap-1.5">

          {/* Category + Delivery */}
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-[var(--muted)] font-bold uppercase tracking-wider truncate max-w-[55%]">
              {displayCategory}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              <Truck size={9} className="text-[var(--muted)]" />
              <span className="text-[7px] text-[var(--muted)] font-medium">Fast Delivery</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-[12px] sm:text-sm font-black text-[var(--heading)] leading-tight line-clamp-2">
            {productName}
          </h3>

          {/* Short Description */}
          <p className="text-[9px] text-[var(--muted)] leading-relaxed line-clamp-2">
            {product.shortDescription || "Premium quality handcrafted product made with finest ingredients for your special moments."}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1 py-0.5">
            {isCakeCategory && <ProductBadge type="veg" />}
            {!isCakeCategory && <ProductBadge type="eggless" />}
            {discountPct > 0 && <ProductBadge type="discount" value={discountPct} />}
            {product.bestseller && <ProductBadge type="bestseller" />}
            {product.featured && <ProductBadge type="featured" />}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-black text-[var(--heading)]">₹{Math.round(finalPrice)}</span>
            {(hasOffer || isCouponApplied) && (
              <span className="text-[9px] font-bold text-[var(--muted)] line-through">₹{isCouponApplied ? displayPrice : mrp}</span>
            )}
            {discountPct > 0 && !isCouponApplied && (
              <span className="text-[8px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                Save {discountPct}%
              </span>
            )}
          </div>

          {/* Rating + Stock */}
          <div className="flex items-center justify-between">
            {rating > 0 ? (
              <div className="flex items-center gap-0.5">
                <Star size={10} fill="#FBBF24" className="text-amber-400" />
                <span className="text-[9px] font-bold text-[var(--heading)]">{rating.toFixed(1)}</span>
                {reviewCount > 0 && <span className="text-[8px] text-[var(--muted)]">({reviewCount})</span>}
              </div>
            ) : <div />}
            {!isOutOfStock && (
              <div className="flex items-center gap-0.5">
                <CheckCircle2 size={9} className="text-emerald-500" />
                <span className="text-[7px] font-medium text-emerald-600">In Stock</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto pt-2 flex flex-col gap-1.5">

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
                  className="w-full flex items-center justify-between p-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Ticket size={10} className="text-amber-500 shrink-0" />
                    <span className="text-[9px] font-bold text-amber-600">Available Coupon</span>
                  </div>
                  <ChevronDown size={10} className="text-amber-500 shrink-0" />
                </button>
              )}
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center gap-1.5 w-full">
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
