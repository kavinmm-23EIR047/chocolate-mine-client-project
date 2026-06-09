import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Star, Tag, Eye, CheckCircle2, XCircle, ShoppingBag, Plus, Minus,
  Ticket, Gift, Sparkles, ChevronDown, Truck, Flame, Crown, Zap,
  Shield, Clock, Package, TrendingUp, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart, updateCartQty } from '../redux/slices/cartSlice';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';

const ImagePlaceholder = () => (
  <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'var(--card-soft)' }}>
    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <ShoppingBag className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
    </div>
    <span className="text-[8px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--muted)' }}>Artisan</span>
  </div>
);

// Enhanced Badge Component with Theme Colors
const ProductBadge = ({ type, value = "", absolute = false }) => {
  const badgeStyles = {
    veg: {
      className: "inline-flex items-center justify-center shrink-0 p-0.5 rounded-md",
      style: { background: 'var(--badge-stock-bg)', boxShadow: 'var(--nm-sunken)' }
    },
    bestseller: {
      className: "inline-flex items-center gap-1 px-2 py-1 rounded-r-lg text-[9px] font-black tracking-wider shadow-md",
      style: { background: 'var(--badge-bestseller-bg)', color: 'var(--badge-bestseller-text)' },
      text: "Best Seller"
    },
    featured: {
      className: "inline-flex items-center gap-1 px-2 py-1 rounded-r-lg text-[9px] font-black tracking-wider shadow-md",
      style: { background: 'var(--badge-featured-bg)', color: 'var(--badge-featured-text)' },
      text: "Featured"
    },
    discount: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: { background: 'var(--badge-discount-bg)', color: 'var(--badge-discount-text)' },
      text: `${value}% OFF`
    },
    new: {
      className: "inline-flex items-center gap-1 px-2 py-1 rounded-r-lg text-[9px] font-black tracking-wider shadow-md",
      style: { background: 'var(--badge-new-bg)', color: 'var(--badge-new-text)' },
      text: "New"
    },
    limited: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: { background: 'var(--badge-limited-bg)', color: 'var(--badge-limited-text)' },
      text: "Limited"
    },
    eggless: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: { background: 'var(--badge-stock-bg)', color: 'var(--badge-stock-text)' },
      text: "Eggless"
    },
    premium: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: { background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white' },
      text: "Premium"
    }
  };

  if (type === 'veg') {
    return (
      <div className={badgeStyles.veg.className} style={badgeStyles.veg.style}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="14" height="14" stroke="#008000" strokeWidth="2" />
          <circle cx="8" cy="8" r="4" fill="#008000" />
        </svg>
      </div>
    );
  }

  const badge = badgeStyles[type];
  if (!badge) return null;

  return (
    <div
      className={`${badge.className} ${absolute ? 'absolute top-2 left-0 z-10' : ''}`}
      style={badge.style}
    >
      <span>{badge.text}</span>
    </div>
  );
};

// Compact Coupon Card with Theme Colors
const CouponCard = ({ coupon, onApply, onRemove, isApplied, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      className="relative rounded-lg overflow-hidden border-l-4 mt-1.5"
      style={{
        background: isApplied ? 'var(--badge-stock-bg)' : 'var(--badge-coupon-bg)',
        borderLeftColor: isApplied ? 'var(--success)' : 'var(--accent)',
      }}
    >
      <div className="p-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="min-w-0 flex-1 flex items-center justify-between">
              <span className="text-[9px] font-mono font-black" style={{ color: 'var(--heading)' }}>{coupon.code}</span>
              <span className="text-[8px] font-bold" style={{ color: isApplied ? 'var(--success-text)' : 'var(--accent)' }}>
                {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
              </span>
            </div>
          </div>
          {isApplied ? (
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-[8px] font-bold text-red-500">Remove</button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onApply(); }} className="px-2 py-0.5 text-[8px] font-black rounded-md" style={{ background: 'var(--accent)', color: 'var(--button-text)' }}>Apply</button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Add to Cart Button (Slightly larger heights as requested)
const AddToCartBtn = ({ onClick, disabled, isOutOfStock, addingToCart, needsVariantSelection }) => {
  const label = needsVariantSelection ? 'Options' : addingToCart ? 'Adding…' : 'Add to Cart';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg h-10 sm:h-11 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95"
      style={{
        background: isOutOfStock ? 'var(--card-soft)' : 'var(--button-bg)',
        color: isOutOfStock ? 'var(--muted)' : 'var(--button-text)',
        border: isOutOfStock ? '1px solid var(--border)' : 'none',
        boxShadow: isOutOfStock ? 'none' : 'var(--nm-button)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: isOutOfStock ? 0.6 : 1
      }}
    >
      <ShoppingBag size={14} className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
};

// Quick View Button (Slightly larger)
const QuickViewBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-1 rounded-lg h-10 sm:h-11 shrink-0 px-2.5 sm:px-3.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95"
    style={{
      background: 'var(--button-alt-bg)',
      color: 'var(--button-alt-text)',
      border: `1px solid var(--border)`,
      boxShadow: 'var(--nm-button)'
    }}
  >
    <Eye size={14} className="shrink-0" />
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

  const cardStyleMap = {
    'rounded-sm': 'rounded-sm',
    'rounded-md': 'rounded-md',
    'rounded-lg': 'rounded-lg',
    'rounded-xl': 'rounded-xl',
  };

  const hasVariants = product.hasVariants || (product.variants && product.variants.length > 0);
  const needsVariantSelection = hasVariants && product.variants?.length > 1;
  const hasOffer = !hasVariants && product.offerPrice && product.offerPrice < product.price;
  const displayPrice = hasOffer ? product.offerPrice : product.price;
  const mrp = product.price;
  const discountPct = hasOffer ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  const coupon = product.coupon;
  const isCouponActive = coupon?.enabled && coupon?.code && (!coupon.endDate || new Date(coupon.endDate) > new Date());
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  const handleApplyCoupon = () => { setIsCouponApplied(true); toast.success(`${coupon.code} applied!`); setShowCoupon(false); };
  const handleRemoveCoupon = () => { setIsCouponApplied(false); toast.success(`${coupon.code} removed`); };

  const finalPrice = isCouponApplied && isCouponActive
    ? coupon.type === 'percent' ? displayPrice - (displayPrice * coupon.value / 100) : Math.max(0, displayPrice - coupon.value)
    : displayPrice;

  const isOutOfStock = product.stock === false;
  const rating = Number(product.ratingsAverage) || 0;
  const reviewCount = Number(product.ratingsCount) || 0;

  const handleQuantityChange = (e, newQty) => {
    e.preventDefault(); e.stopPropagation();
    if (newQty < 0) return;
    try {
      if (newQty === 0) { dispatch(removeFromCart(product._id)); toast.success('Removed from bag'); }
      else { dispatch(updateCartQty({ productId: product._id, qty: newQty })); }
    } catch (err) { toast.error('Could not update bag'); }
  };

  const handleInitialAdd = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isOutOfStock) return;
    if (needsVariantSelection) { navigate(`/product/${product.slug}`); return; }
    try {
      setAddingToCart(true);
      dispatch(addToCart({
        product: product, qty: 1,
        options: hasVariants && product.variants ? { flavor: product.variants[0].flavor, weight: product.variants[0].weight } : null,
        variantPrice: hasVariants && product.variants ? product.variants[0].price : null
      }));
      toast.success('Added to bag');
    } catch (err) { toast.error('Failed to add'); } finally { setTimeout(() => setAddingToCart(false), 300); }
  };

  const wish = (e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product._id); };

  const productName = product.name;
  const hasValidImage = product.image && product.image !== 'none' && product.image.trim() !== '';
  const isCakeCategory = String(product.category || '').toLowerCase().includes('cake');

  const QuantitySelector = () => (
    <div className="flex items-center justify-between rounded-lg font-bold h-10 sm:h-11 w-full" style={{ background: 'var(--card)', border: `1px solid var(--border)`, color: 'var(--heading)' }} onClick={(e) => e.stopPropagation()}>
      <button onClick={(e) => handleQuantityChange(e, cartQuantity - 1)} className="h-full px-3 sm:px-4 flex items-center justify-center transition-colors rounded-l-lg" style={{ borderRight: `1px solid var(--border)` }}>
        <Minus size={12} />
      </button>
      <span className="text-[12px] px-2 font-black">{cartQuantity}</span>
      <button onClick={(e) => handleQuantityChange(e, cartQuantity + 1)} className="h-full px-3 sm:px-4 flex items-center justify-center transition-colors rounded-r-lg" style={{ borderLeft: `1px solid var(--border)` }}>
        <Plus size={12} />
      </button>
    </div>
  );

  // ─── Horizontal Layout (mobile list view) ───────────────────────────────
  if (layout === 'horizontal') {
    return (
      <motion.div
        layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigate(`/product/${product.slug}`)}
        className={`group flex flex-row p-2 sm:p-3 gap-3 cursor-pointer transition-all duration-300 w-full ${cardStyleMap[cardStyle]}`}
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-lg overflow-hidden" style={{ background: 'var(--surface)' }}>
          {hasValidImage ? <img src={product.image} alt={product.name} className="w-full h-full object-cover object-center" loading="lazy" /> : <ImagePlaceholder />}
          <button onClick={wish} className="absolute top-1.5 right-1.5 p-1.5 rounded-full shadow-sm z-10 bg-white/80 hover:bg-white transition-colors">
            <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} style={{ color: isLiked ? '#ef4444' : '#666' }} />
          </button>
          {product.bestseller && <ProductBadge type="bestseller" absolute />}
        </div>
        <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
          <div className="space-y-1">
            <h3 className="text-[13px] sm:text-[14px] font-semibold leading-snug line-clamp-2" style={{ color: 'var(--heading)' }}>{productName}</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[14px] sm:text-[15px] font-black" style={{ color: 'var(--heading)' }}>₹{Math.round(finalPrice)}</span>
              {(hasOffer || isCouponApplied) && (
                <>
                  <span className="text-[10px] sm:text-[11px] font-medium line-through text-gray-400">₹{isCouponApplied ? displayPrice : mrp}</span>
                  {discountPct > 0 && <span className="text-[10px] sm:text-[11px] font-bold text-orange-500">{discountPct}% OFF</span>}
                </>
              )}
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="bg-green-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 text-[10px] font-bold">
                  <Star size={9} fill="white" /> {rating.toFixed(1)}
                </span>
                {reviewCount > 0 && <span className="text-[10px] text-gray-500 font-medium">({reviewCount} Reviews)</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
             {cartQuantity > 0 && !needsVariantSelection ? <div className="flex-1"><QuantitySelector /></div> : <AddToCartBtn onClick={handleInitialAdd} disabled={isOutOfStock} isOutOfStock={isOutOfStock} addingToCart={addingToCart} needsVariantSelection={needsVariantSelection} />}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Vertical Layout (Grid view matching reference exactly) ─────────────────────
  return (
    <motion.div
      layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigate(`/product/${product.slug}`)}
      className={`group h-full flex flex-col transition-all duration-300 overflow-hidden w-full ${cardStyleMap[cardStyle]}`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Image - reduced height / increased width appearance by using aspect-square or slightly tall aspect */}
      <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden shrink-0 w-full" style={{ background: 'var(--surface)' }}>
        {hasValidImage ? <img src={product.image} alt={product.name} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <ImagePlaceholder />}
        
        {/* Floating Heart Top Right */}
        <button onClick={wish} className="absolute top-2 right-2 p-1.5 rounded-full shadow-sm z-10 bg-white/80 hover:bg-white transition-colors">
          <Heart size={16} fill={isLiked ? '#ef4444' : 'none'} style={{ color: isLiked ? '#ef4444' : '#666' }} />
        </button>

        {/* Floating Badge Top Left */}
        {product.bestseller && <ProductBadge type="bestseller" absolute />}
        {!product.bestseller && product.featured && <ProductBadge type="featured" absolute />}
        {!product.bestseller && !product.featured && product.new && <ProductBadge type="new" absolute />}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-[10px] font-black text-red-600 px-2 py-1 rounded shadow-sm bg-white border border-red-200 uppercase tracking-widest">Sold Out</span>
          </div>
        )}
      </div>

      {/* Content Aligned Left */}
      <div className="p-2 sm:p-3 flex flex-col flex-1 text-left">
        {/* Title */}
        <h3 className="text-[12px] sm:text-[14px] font-medium leading-snug line-clamp-1 mb-1" style={{ color: 'var(--heading)' }}>
          {productName}
        </h3>

        {/* Pricing Line */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          <span className="text-[14px] sm:text-[16px] font-bold" style={{ color: 'var(--heading)' }}>₹{Math.round(finalPrice)}</span>
          {(hasOffer || isCouponApplied) && (
            <>
              <span className="text-[11px] sm:text-[12px] line-through text-gray-400">₹{isCouponApplied ? displayPrice : mrp}</span>
              {discountPct > 0 && <span className="text-[11px] sm:text-[12px] font-bold text-orange-500">{discountPct}% OFF</span>}
            </>
          )}
        </div>

        {/* Rating Line */}
        <div className="flex items-center gap-1.5 mb-1.5">
          {rating > 0 ? (
            <>
              <span className="bg-green-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold">
                <Star size={10} fill="white" /> {rating.toFixed(1)}
              </span>
              {reviewCount > 0 && <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">({reviewCount} Reviews)</span>}
            </>
          ) : (
            <span className="text-[10px] text-gray-400">No reviews yet</span>
          )}
        </div>

        {/* Delivery Info */}
        <div className="flex items-center gap-1 mt-auto pb-2 border-b border-gray-100 dark:border-gray-800">
           <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">Earliest Delivery: <strong className="font-semibold text-gray-700 dark:text-gray-300">In 3 hours</strong></span>
           <Info size={10} className="text-gray-400 shrink-0" />
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full mt-2">
          <QuickViewBtn onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.slug}`); }} />
          {cartQuantity > 0 && !needsVariantSelection ? (
            <div className="flex-1"><QuantitySelector /></div>
          ) : (
            <AddToCartBtn onClick={handleInitialAdd} disabled={isOutOfStock} isOutOfStock={isOutOfStock} addingToCart={addingToCart} needsVariantSelection={needsVariantSelection} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
