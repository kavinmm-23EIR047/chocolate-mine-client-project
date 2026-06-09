import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Star, Eye, CheckCircle2, XCircle, ShoppingBag, Plus, Minus,
  Ticket, Gift, Sparkles, ChevronDown, Truck, Flame, Crown, Zap,
  Clock, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart, updateCartQty } from '../redux/slices/cartSlice';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';

/* ─── Image Placeholder ─────────────────────────────────────────────────────── */
const ImagePlaceholder = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--card-soft,#f5f0ed)]">
    <div className="w-10 h-10 border border-[var(--border,#e5e0dd)] rounded-full flex items-center justify-center bg-[var(--card,#fff)]">
      <ShoppingBag className="w-4 h-4 text-[var(--muted,#a09890)]" />
    </div>
    <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--muted,#a09890)] mt-1.5">Artisan</span>
  </div>
);

/* ─── Veg Dot ────────────────────────────────────────────────────────────────── */
const VegDot = () => (
  <div title="Pure Veg" className="inline-flex items-center justify-center shrink-0">
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="14" height="14" stroke="#008000" strokeWidth="2" />
      <circle cx="8" cy="8" r="4" fill="#008000" />
    </svg>
  </div>
);

/* ─── Badge Chip ─────────────────────────────────────────────────────────────── */
const BadgeChip = ({ type, value = "" }) => {
  const badges = {
    bestseller: { icon: <Flame size={8} />,        text: "Bestseller", cls: "bg-amber-50  border border-amber-200  text-amber-700"  },
    featured:   { icon: <Crown size={8} />,         text: "Featured",   cls: "bg-purple-50 border border-purple-200 text-purple-700" },
    discount:   { icon: <Zap size={8} />,           text: `${value}% OFF`, cls: "bg-red-50 border border-red-200 text-red-600"       },
    new:        { icon: <Sparkles size={8} />,       text: "New",        cls: "bg-emerald-50 border border-emerald-200 text-emerald-700" },
    limited:    { icon: <Clock size={8} />,          text: "Limited",    cls: "bg-orange-50 border border-orange-200 text-orange-700" },
    eggless:    { icon: <CheckCircle2 size={8} />,   text: "Eggless",    cls: "bg-teal-50 border border-teal-200 text-teal-700"      },
    premium:    { icon: <TrendingUp size={8} />,     text: "Premium",    cls: "bg-indigo-50 border border-indigo-200 text-indigo-700" },
  };
  const badge = badges[type];
  if (!badge) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold shrink-0 ${badge.cls}`}>
      {badge.icon}
      {badge.text}
    </span>
  );
};

/* ─── Coupon Row ─────────────────────────────────────────────────────────────── */
const CouponCard = ({ coupon, onApply, onRemove, isApplied, onClose }) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    className={`relative rounded-xl overflow-hidden border-l-4 ${isApplied ? 'border-l-emerald-500 bg-emerald-50' : 'border-l-amber-400 bg-amber-50'}`}
  >
    <div className="px-2 py-1.5 flex items-center gap-2">
      <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${isApplied ? 'bg-emerald-100' : 'bg-amber-100'}`}>
        {isApplied ? <CheckCircle2 size={10} className="text-emerald-600" /> : <Gift size={10} className="text-amber-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[8px] font-mono font-black text-gray-800">{coupon.code}</span>
          <span className={`text-[7px] font-bold px-1 py-0.5 rounded-full ${isApplied ? 'bg-emerald-200 text-emerald-700' : 'bg-amber-200 text-amber-700'}`}>
            {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
          </span>
        </div>
      </div>
      {isApplied ? (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-[8px] font-semibold text-gray-400 hover:text-red-500 shrink-0">Remove</button>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); onApply(); }} className="px-2 py-0.5 text-[8px] font-black rounded-lg bg-amber-500 text-white hover:bg-amber-600 shrink-0">Apply</button>
      )}
    </div>
    {!isApplied && onClose && (
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-1 right-1">
        <XCircle size={9} className="text-gray-400" />
      </button>
    )}
  </motion.div>
);

/* ═══════════════════════════════════════════════════════
   PRODUCT CARD
   ═══════════════════════════════════════════════════════ */
const ProductCard = ({ product, layout = 'vertical', cardStyle = 'rounded-lg' }) => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCoupon, setShowCoupon]     = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  const cartItems       = useSelector((s) => s.cart?.items || []);
  const currentCartItem = cartItems.find(i => i.product?._id === product._id || i._id === product._id);
  const cartQuantity    = currentCartItem ? currentCartItem.qty : 0;
  const isLiked         = isInWishlist(product._id);

  const hasVariants          = product.hasVariants || (product.variants && product.variants.length > 0);
  const needsVariantSelection = hasVariants && product.variants?.length > 1;
  const hasOffer             = !hasVariants && product.offerPrice && product.offerPrice < product.price;
  const displayPrice         = hasOffer ? product.offerPrice : product.price;
  const mrp                  = product.price;
  const discountPct          = hasOffer ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  const coupon         = product.coupon;
  const isCouponActive = coupon?.enabled && coupon?.code && (!coupon.endDate || new Date(coupon.endDate) > new Date());

  const finalPrice = isCouponApplied && isCouponActive
    ? coupon.type === 'percent'
      ? displayPrice - (displayPrice * coupon.value / 100)
      : Math.max(0, displayPrice - coupon.value)
    : displayPrice;

  const isOutOfStock = product.stock === false;
  const rating       = Number(product.ratingsAverage) || 0;
  const reviewCount  = Number(product.ratingsCount)   || 0;
  const hasValidImage = product.image && product.image !== 'none' && product.image.trim() !== '';
  const isCakeCategory = String(product.category || '').toLowerCase().includes('cake');
  const displayCategory = product.category ? product.category.replace(/-/g, ' ') : 'Artisan Delight';

  const handleQuantityChange = (e, newQty) => {
    e.preventDefault(); e.stopPropagation();
    if (newQty < 0) return;
    if (newQty === 0) { dispatch(removeFromCart(product._id)); toast.success('Removed from bag'); }
    else               { dispatch(updateCartQty({ productId: product._id, qty: newQty })); }
  };

  const handleInitialAdd = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isOutOfStock) return;
    if (needsVariantSelection) { navigate(`/product/${product.slug}`); return; }
    try {
      setAddingToCart(true);
      dispatch(addToCart({
        product,
        qty: 1,
        options: hasVariants && product.variants ? { flavor: product.variants[0].flavor, weight: product.variants[0].weight } : null,
        variantPrice: hasVariants && product.variants ? product.variants[0].price : null,
      }));
      toast.success('Added to bag');
    } catch { toast.error('Failed to add'); }
    finally { setTimeout(() => setAddingToCart(false), 300); }
  };

  const wish = (e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product._id); };

  /* ── Quantity Stepper ── */
  const QuantityStepper = () => (
    <div
      className="flex items-center rounded-2xl border border-[var(--border,#e5e0dd)] bg-[var(--card,#fff)] overflow-hidden h-10 flex-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={(e) => handleQuantityChange(e, cartQuantity - 1)}
        className="h-full px-3 flex items-center justify-center hover:bg-[var(--card-soft,#f5f0ed)] border-r border-[var(--border,#e5e0dd)] transition-colors active:scale-90">
        <Minus size={11} className="text-[var(--heading,#1a1008)]" />
      </button>
      <span className="flex-1 text-center text-[12px] font-black text-[var(--heading,#1a1008)]">{cartQuantity}</span>
      <button onClick={(e) => handleQuantityChange(e, cartQuantity + 1)}
        className="h-full px-3 flex items-center justify-center hover:bg-[var(--card-soft,#f5f0ed)] border-l border-[var(--border,#e5e0dd)] transition-colors active:scale-90">
        <Plus size={11} className="text-[var(--heading,#1a1008)]" />
      </button>
    </div>
  );

  /* ════════════════════════════════════════════════════
     HORIZONTAL CARD  (mobile list view)
     ════════════════════════════════════════════════════ */
  if (layout === 'horizontal') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate(`/product/${product.slug}`)}
        className="group flex flex-row bg-[var(--card,#fff)] border border-[var(--border,#e5e0dd)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden w-full"
      >
        {/* Left image */}
        <div className="relative w-[130px] shrink-0 self-stretch min-h-[130px]">
          {hasValidImage
            ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
            : <ImagePlaceholder />
          }
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-start p-2">
              <span className="text-[8px] font-black text-white bg-red-500 px-2 py-1 rounded-lg uppercase">Sold Out</span>
            </div>
          )}
          {/* Artisan label */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent pb-1.5 pt-6 flex justify-center">
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/80">Artisan</span>
          </div>
          {/* Wishlist */}
          <button onClick={wish}
            className="absolute top-2 right-2 w-6 h-6 bg-[var(--card,#fff)]/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-all z-10">
            <Heart size={11} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : 'text-[var(--muted,#a09890)]'} />
          </button>
        </div>

        {/* Right content */}
        <div className="flex flex-col flex-1 min-w-0 px-3 py-3 gap-1.5">
          {/* Category + delivery */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[8px] text-[var(--muted,#a09890)] font-bold uppercase tracking-wider truncate">
              {displayCategory}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              <Truck size={8} className="text-[var(--muted,#a09890)]" />
              <span className="text-[7px] text-[var(--muted,#a09890)] font-medium whitespace-nowrap">Fast Delivery</span>
            </div>
          </div>

          {/* Product name — allow 2 lines */}
          <h3 className="text-[13px] font-black text-[var(--heading,#1a1008)] leading-snug line-clamp-2">
            {product.name}
          </h3>

          {/* Badges — wrap freely, no overflow-hidden */}
          <div className="flex items-center gap-1 flex-wrap">
            <VegDot />
            {discountPct > 0 && <BadgeChip type="discount" value={discountPct} />}
            {product.bestseller && <BadgeChip type="bestseller" />}
            {product.featured   && <BadgeChip type="featured"   />}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base font-black text-[var(--heading,#1a1008)]">₹{Math.round(finalPrice)}</span>
            {(hasOffer || isCouponApplied) && (
              <span className="text-[10px] font-semibold text-[var(--muted,#a09890)] line-through">
                ₹{isCouponApplied ? displayPrice : mrp}
              </span>
            )}
            {discountPct > 0 && !isCouponApplied && (
              <span className="text-[8px] font-black text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                -{discountPct}%
              </span>
            )}
          </div>

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={10} fill="#FBBF24" className="text-amber-400" />
              <span className="text-[10px] font-bold text-[var(--heading,#1a1008)]">{rating.toFixed(1)}</span>
              {reviewCount > 0 && <span className="text-[9px] text-[var(--muted,#a09890)]">({reviewCount})</span>}
            </div>
          )}

          {/* Coupon */}
          {isCouponActive && (
            <div onClick={(e) => e.stopPropagation()}>
              {isCouponApplied ? (
                <CouponCard coupon={coupon} onApply={() => {}} isApplied={true}
                  onRemove={() => { setIsCouponApplied(false); toast.success(`${coupon.code} removed`); }} />
              ) : showCoupon ? (
                <CouponCard coupon={coupon} isApplied={false} onClose={() => setShowCoupon(false)}
                  onApply={() => { setIsCouponApplied(true); toast.success(`${coupon.code} applied!`); setShowCoupon(false); }}
                  onRemove={() => {}} />
              ) : (
                <button onClick={(e) => { e.stopPropagation(); setShowCoupon(true); }}
                  className="flex items-center gap-1 text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                  <Ticket size={9} /> Coupon available <ChevronDown size={9} />
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-auto pt-1 flex items-center gap-2">
            {/* Eye icon — circle outline */}
            <button onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.slug}`); }}
              className="w-10 h-10 flex items-center justify-center rounded-2xl border border-[var(--border,#e5e0dd)] bg-[var(--card,#fff)] hover:bg-[var(--card-soft,#f5f0ed)] shadow-sm transition-all active:scale-95 shrink-0">
              <Eye size={15} className="text-[var(--heading,#1a1008)]" />
            </button>

            {cartQuantity > 0 && !needsVariantSelection ? (
              <QuantityStepper />
            ) : (
              /* Cart button — pill, full remaining width */
              <button onClick={handleInitialAdd} disabled={isOutOfStock}
                className={`flex-1 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-95 shadow-sm ${
                  isOutOfStock
                    ? 'bg-[var(--card-soft,#f5f0ed)] border border-[var(--border,#e5e0dd)] cursor-not-allowed opacity-50'
                    : 'bg-[var(--button-bg,#4E2820)] hover:opacity-90'
                }`}>
                <ShoppingBag size={15} className={isOutOfStock ? 'text-[var(--muted,#a09890)]' : 'text-[var(--button-text,#F2E2DB)]'} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  /* ════════════════════════════════════════════════════
     VERTICAL CARD  (2-col grid / desktop)
     ════════════════════════════════════════════════════ */
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/product/${product.slug}`)}
      className="group h-full flex flex-col bg-[var(--card,#fff)] border border-[var(--border,#e5e0dd)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden w-full"
    >
      {/* Image */}
      <div className="relative aspect-square bg-[var(--card-soft,#f5f0ed)] overflow-hidden shrink-0">
        {hasValidImage
          ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          : <ImagePlaceholder />
        }
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/45 flex items-start justify-start p-2.5">
            <span className="text-[9px] font-black text-white bg-red-500 px-2 py-1 rounded-lg uppercase tracking-wide">Sold Out</span>
          </div>
        )}
        {/* Artisan gradient label */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent pb-2 pt-8 flex justify-center">
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/80">Artisan</span>
        </div>
        {/* Wishlist */}
        <button onClick={wish}
          className="absolute top-2 right-2 w-7 h-7 bg-[var(--card,#fff)]/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-all z-10">
          <Heart size={12} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : 'text-[var(--muted,#a09890)]'} />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-3 py-3 gap-2">

        {/* Category + delivery */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[8px] text-[var(--muted,#a09890)] font-bold uppercase tracking-wider truncate max-w-[60%]">
            {displayCategory}
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            <Truck size={8} className="text-[var(--muted,#a09890)]" />
            <span className="text-[7px] text-[var(--muted,#a09890)] font-medium whitespace-nowrap">Fast Delivery</span>
          </div>
        </div>

        {/* Product name — 2 lines max, no hard truncate on single line */}
        <h3 className="text-[13px] font-black text-[var(--heading,#1a1008)] leading-snug line-clamp-2 min-h-[2.2em]">
          {product.name}
        </h3>

        {/* Badges — WRAP freely, no overflow-hidden */}
        <div className="flex items-center gap-1 flex-wrap">
          <VegDot />
          {discountPct > 0 && <BadgeChip type="discount" value={discountPct} />}
          {product.bestseller && <BadgeChip type="bestseller" />}
          {product.featured   && <BadgeChip type="featured"   />}
          {product.isNew      && <BadgeChip type="new"        />}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[17px] font-black text-[var(--heading,#1a1008)]">₹{Math.round(finalPrice)}</span>
          {(hasOffer || isCouponApplied) && (
            <span className="text-[10px] font-semibold text-[var(--muted,#a09890)] line-through">
              ₹{isCouponApplied ? displayPrice : mrp}
            </span>
          )}
          {discountPct > 0 && !isCouponApplied && (
            <span className="text-[8px] font-black text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <Star size={11} fill="#FBBF24" className="text-amber-400" />
            <span className="text-[11px] font-bold text-[var(--heading,#1a1008)]">{rating.toFixed(1)}</span>
            {reviewCount > 0 && <span className="text-[9px] text-[var(--muted,#a09890)]">({reviewCount})</span>}
          </div>
        )}

        {/* Coupon */}
        {isCouponActive && (
          <div onClick={(e) => e.stopPropagation()}>
            {isCouponApplied ? (
              <CouponCard coupon={coupon} onApply={() => {}} isApplied={true}
                onRemove={() => { setIsCouponApplied(false); toast.success(`${coupon.code} removed`); }} />
            ) : showCoupon ? (
              <CouponCard coupon={coupon} isApplied={false} onClose={() => setShowCoupon(false)}
                onApply={() => { setIsCouponApplied(true); toast.success(`${coupon.code} applied!`); setShowCoupon(false); }}
                onRemove={() => {}} />
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setShowCoupon(true); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 hover:border-amber-400 transition-colors">
                <div className="flex items-center gap-1.5">
                  <Ticket size={10} className="text-amber-500 shrink-0" />
                  <span className="text-[9px] font-bold text-amber-600">Coupon Available</span>
                </div>
                <ChevronDown size={10} className="text-amber-500 shrink-0" />
              </button>
            )}
          </div>
        )}

        {/* Action buttons — pinned to bottom */}
        <div className="mt-auto pt-2 flex items-center gap-2">
          {/* Eye */}
          <button onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.slug}`); }}
            className="w-10 h-10 flex items-center justify-center rounded-2xl border border-[var(--border,#e5e0dd)] bg-[var(--card,#fff)] hover:bg-[var(--card-soft,#f5f0ed)] shadow-sm transition-all active:scale-95 shrink-0">
            <Eye size={15} className="text-[var(--heading,#1a1008)]" />
          </button>

          {cartQuantity > 0 && !needsVariantSelection ? (
            <QuantityStepper />
          ) : (
            <button onClick={handleInitialAdd} disabled={isOutOfStock}
              className={`flex-1 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-95 shadow-sm ${
                isOutOfStock
                  ? 'bg-[var(--card-soft,#f5f0ed)] border border-[var(--border,#e5e0dd)] cursor-not-allowed opacity-50'
                  : 'bg-[var(--button-bg,#4E2820)] hover:opacity-90'
              }`}>
              <ShoppingBag size={15} className={isOutOfStock ? 'text-[var(--muted,#a09890)]' : 'text-[var(--button-text,#F2E2DB)]'} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
