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
  <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'var(--card-soft)' }}>
    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <ShoppingBag className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
    </div>
    <span className="text-[8px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--muted)' }}>Artisan</span>
  </div>
);

// Enhanced Badge Component with Theme Colors & Neurophism
const ProductBadge = ({ type, value = "" }) => {
  const badgeStyles = {
    veg: {
      className: "inline-flex items-center justify-center shrink-0 p-0.5 rounded-md",
      style: {
        background: 'var(--badge-stock-bg)',
        boxShadow: 'var(--nm-sunken)'
      }
    },
    bestseller: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: {
        background: 'var(--badge-bestseller-bg)',
        color: 'var(--badge-bestseller-text)',
        border: `1px solid var(--badge-bestseller-border)`,
        boxShadow: 'var(--nm-button)'
      },
      icon: <Flame size={9} className="animate-pulse" />,
      text: "Bestseller"
    },
    featured: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: {
        background: 'var(--badge-featured-bg)',
        color: 'var(--badge-featured-text)',
        border: `1px solid var(--badge-featured-border)`,
        boxShadow: 'var(--nm-button)'
      },
      icon: <Crown size={9} />,
      text: "Featured"
    },
    discount: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: {
        background: 'var(--badge-discount-bg)',
        color: 'var(--badge-discount-text)',
        border: `1px solid var(--badge-discount-border)`,
        boxShadow: 'var(--nm-button)'
      },
      icon: <Zap size={9} className="animate-pulse" />,
      text: `${value}% OFF`
    },
    new: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: {
        background: 'var(--badge-new-bg)',
        color: 'var(--badge-new-text)',
        border: `1px solid var(--badge-new-border)`,
        boxShadow: 'var(--nm-button)'
      },
      icon: <Sparkles size={9} />,
      text: "New"
    },
    limited: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: {
        background: 'var(--badge-limited-bg)',
        color: 'var(--badge-limited-text)',
        border: `1px solid var(--badge-limited-border)`,
        boxShadow: 'var(--nm-button)'
      },
      icon: <Clock size={9} />,
      text: "Limited"
    },
    eggless: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: {
        background: 'var(--badge-stock-bg)',
        color: 'var(--badge-stock-text)',
        border: `1px solid var(--badge-stock-border)`,
        boxShadow: 'var(--nm-button)'
      },
      icon: <CheckCircle2 size={9} />,
      text: "Eggless"
    },
    premium: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: {
        background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
        color: 'white',
        boxShadow: 'var(--nm-button)'
      },
      icon: <TrendingUp size={9} />,
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
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={badge.className}
      style={badge.style}
    >
      <span>{badge.icon}</span>
      <span>{badge.text}</span>
    </motion.div>
  );
};

// Compact Coupon Card with Theme Colors
const CouponCard = ({ coupon, onApply, onRemove, isApplied, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      className="relative rounded-xl overflow-hidden border-l-4"
      style={{
        background: isApplied ? 'var(--badge-stock-bg)' : 'var(--badge-coupon-bg)',
        borderLeftColor: isApplied ? 'var(--success)' : 'var(--accent)',
        boxShadow: 'var(--nm-sunken)'
      }}
    >
      <div className="p-1.5 sm:p-2">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div 
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: isApplied ? 'var(--badge-stock-bg)' : 'var(--badge-coupon-bg)',
                boxShadow: 'var(--nm-sunken)'
              }}
            >
              {isApplied
                ? <CheckCircle2 size={9} style={{ color: 'var(--success)' }} />
                : <Gift size={9} style={{ color: 'var(--accent)' }} />
              }
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[8px] font-mono font-black" style={{ color: 'var(--heading)' }}>{coupon.code}</span>
                <span 
                  className="text-[7px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isApplied ? 'var(--badge-stock-bg)' : 'var(--badge-coupon-bg)',
                    color: isApplied ? 'var(--success-text)' : 'var(--accent)',
                    border: `1px solid ${isApplied ? 'var(--badge-stock-border)' : 'var(--badge-coupon-border)'}`
                  }}
                >
                  {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                </span>
              </div>
              <p className="text-[7px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{coupon.description || `Save on this product`}</p>
            </div>
          </div>

          {isApplied ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="text-[7px] font-bold shrink-0 whitespace-nowrap transition-colors hover:text-red-500"
              style={{ color: 'var(--muted)' }}
            >
              Remove
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onApply(); }}
              className="px-1.5 py-0.5 text-[7px] font-black rounded-lg transition-all active:scale-95"
              style={{
                background: 'var(--accent)',
                color: 'var(--button-text)',
                boxShadow: 'var(--nm-button)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
            >
              Apply
            </button>
          )}
        </div>
      </div>

      {!isApplied && onClose && (
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-black/5">
          <XCircle size={8} style={{ color: 'var(--muted)' }} />
        </button>
      )}
    </motion.div>
  );
};

// Add to Cart Button with Theme Colors (Light theme: dark bg + light text, Dark theme: light bg + dark text)
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
      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl h-8 sm:h-9 text-[9px] sm:text-[10px] font-black uppercase tracking-wide transition-all active:scale-95"
      style={{
        background: isOutOfStock ? 'var(--card-soft)' : 'var(--button-bg)',
        color: isOutOfStock ? 'var(--muted)' : 'var(--button-text)',
        border: isOutOfStock ? '1px solid var(--border)' : 'none',
        boxShadow: isOutOfStock ? 'none' : 'var(--nm-button)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: isOutOfStock ? 0.6 : 1
      }}
      onMouseEnter={(e) => {
        if (!isOutOfStock) {
          e.currentTarget.style.background = 'var(--button-hover)';
          e.currentTarget.style.boxShadow = 'var(--nm-extruded)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isOutOfStock) {
          e.currentTarget.style.background = 'var(--button-bg)';
          e.currentTarget.style.boxShadow = 'var(--nm-button)';
        }
      }}
    >
      <ShoppingBag size={12} className="shrink-0" />
      <span className="hidden sm:inline truncate">{label}</span>
    </button>
  );
};

// Quick View Button with Theme Colors
const QuickViewBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-1 rounded-xl h-8 sm:h-9 shrink-0 px-2 sm:px-3 text-[8px] sm:text-[9px] font-bold uppercase tracking-wide transition-all active:scale-95 whitespace-nowrap"
    style={{
      background: 'var(--button-alt-bg)',
      color: 'var(--button-alt-text)',
      border: `1px solid var(--border)`,
      boxShadow: 'var(--nm-button)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--button-alt-hover)';
      e.currentTarget.style.boxShadow = 'var(--nm-extruded)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'var(--button-alt-bg)';
      e.currentTarget.style.boxShadow = 'var(--nm-button)';
    }}
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

  // Map card style to CSS class
  const cardStyleMap = {
    'rounded-sm': 'product-card-rounded-sm',
    'rounded-md': 'product-card-rounded-md',
    'rounded-lg': 'product-card-rounded-lg',
    'rounded-xl': 'product-card-rounded-xl',
    'soft': 'product-card-soft',
    'pill': 'product-card-pill'
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

  // Quantity Selector with Theme Colors
  const QuantitySelector = () => (
    <div 
      className="flex items-center justify-between rounded-xl font-bold h-8 sm:h-9 w-full"
      style={{
        background: 'var(--card)',
        border: `1px solid var(--border)`,
        color: 'var(--heading)',
        boxShadow: 'var(--nm-sunken)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => handleQuantityChange(e, cartQuantity - 1)}
        className="h-full px-2.5 sm:px-3 flex items-center justify-center transition-colors rounded-l-xl"
        style={{ borderRight: `1px solid var(--border)` }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-soft)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Minus size={10} />
      </button>
      <span className="text-[11px] px-1.5 font-black">{cartQuantity}</span>
      <button
        onClick={(e) => handleQuantityChange(e, cartQuantity + 1)}
        className="h-full px-2.5 sm:px-3 flex items-center justify-center transition-colors rounded-r-xl"
        style={{ borderLeft: `1px solid var(--border)` }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-soft)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
        className={`group flex flex-row p-2 sm:p-2.5 gap-2.5 sm:gap-3 cursor-pointer transition-all duration-300 w-full ${cardStyleMap[cardStyle]}`}
        style={{ background: 'var(--card)' }}
      >
        {/* Image */}
        <div 
          className="relative w-[88px] h-[88px] sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden"
          style={{ background: 'var(--surface)', border: `1px solid var(--border)`, boxShadow: 'var(--nm-sunken)' }}
        >
          {hasValidImage
            ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
            : <ImagePlaceholder />
          }
          <button 
            onClick={wish} 
            className="absolute top-1 right-1 p-1 rounded-full shadow-md hover:scale-110 transition-all z-10"
            style={{ background: 'var(--card)/80', backdropFilter: 'blur(4px)' }}
          >
            <Heart size={10} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : ''} style={{ color: isLiked ? '#ef4444' : 'var(--muted)' }} />
          </button>
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
              <span className="text-[8px] font-black text-white px-1.5 py-0.5 rounded-full shadow-lg badge-soldout">SOLD OUT</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
          <div className="space-y-0.5 sm:space-y-1">
            {/* Badges Row */}
            <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
              {isCakeCategory && <ProductBadge type="veg" />}
              {discountPct > 0 && <ProductBadge type="discount" value={discountPct} />}
              {product.bestseller && <ProductBadge type="bestseller" />}
              {product.featured && <ProductBadge type="featured" />}
              {product.eggless !== false && !isCakeCategory && <ProductBadge type="eggless" />}
            </div>
            <h3 className="text-[11px] sm:text-sm font-black leading-tight line-clamp-1 sm:line-clamp-2" style={{ color: 'var(--heading)' }}>{productName}</h3>
            <p className="text-[8px] line-clamp-1 sm:line-clamp-2 leading-relaxed hidden sm:block" style={{ color: 'var(--muted)' }}>
              {product.shortDescription || "Premium quality handcrafted product made with finest ingredients."}
            </p>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-sm font-black" style={{ color: 'var(--heading)' }}>₹{Math.round(finalPrice)}</span>
              {(hasOffer || isCouponApplied) && (
                <span className="text-[8px] font-bold line-through" style={{ color: 'var(--muted)' }}>₹{isCouponApplied ? displayPrice : mrp}</span>
              )}
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-0.5">
                <Star size={9} fill="#FBBF24" className="text-amber-400" style={{ color: 'var(--star)' }} />
                <span className="text-[8px] font-bold" style={{ color: 'var(--heading)' }}>{rating.toFixed(1)}</span>
                {reviewCount > 0 && <span className="text-[7px]" style={{ color: 'var(--muted)' }}>({reviewCount})</span>}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 mt-1 pt-1" style={{ borderTop: `1px solid var(--border)` }}>
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
      className={`group h-full flex flex-col transition-all duration-300 overflow-hidden w-full ${cardStyleMap[cardStyle]}`}
      style={{ background: 'var(--card)' }}
    >
      {/* Image */}
      <div 
        className="relative aspect-[16/9] sm:aspect-[4/3] overflow-hidden shrink-0"
        style={{ background: 'var(--surface)' }}
      >
        {hasValidImage
          ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          : <ImagePlaceholder />
        }
        <button
          onClick={wish}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 sm:p-2 rounded-full shadow-md hover:scale-110 transition-all z-10"
          style={{ background: 'var(--card)', backdropFilter: 'blur(4px)' }}
        >
          <Heart size={12} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : ''} style={{ color: isLiked ? '#ef4444' : 'var(--muted)' }} />
        </button>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-1">
              <XCircle size={16} className="text-red-400" />
              <span className="text-[9px] font-black text-white px-2 py-0.5 rounded-full shadow-lg badge-soldout">SOLD OUT</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2 sm:p-3 flex flex-col flex-1">
        <div className="flex flex-col gap-1 sm:gap-1.5">
          {/* Category + Delivery */}
          <div className="flex items-center justify-between">
            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-wider truncate max-w-[60%]" style={{ color: 'var(--muted)' }}>
              {displayCategory}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              <Truck size={8} style={{ color: 'var(--muted)' }} />
              <span className="text-[6px] sm:text-[7px] font-bold" style={{ color: 'var(--muted)' }}>Fast Delivery</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-[11px] sm:text-sm font-black leading-tight line-clamp-1 sm:line-clamp-2" style={{ color: 'var(--heading)' }}>
            {productName}
          </h3>

          {/* Short Description */}
          <p className="text-[8px] leading-relaxed line-clamp-1 hidden sm:block" style={{ color: 'var(--muted)' }}>
            {product.shortDescription || "Premium quality handcrafted product made with finest ingredients for your special moments."}
          </p>

          {/* Badges Row */}
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
            <span className="text-sm sm:text-lg font-black" style={{ color: 'var(--heading)' }}>₹{Math.round(finalPrice)}</span>
            {(hasOffer || isCouponApplied) && (
              <span className="text-[8px] font-bold line-through" style={{ color: 'var(--muted)' }}>₹{isCouponApplied ? displayPrice : mrp}</span>
            )}
            {discountPct > 0 && !isCouponApplied && (
              <span className="text-[7px] sm:text-[8px] font-black text-white px-1.5 py-0.5 rounded-full shadow-md badge-discount">
                -{discountPct}%
              </span>
            )}
          </div>

          {/* Rating + Stock */}
          <div className="flex items-center justify-between">
            {rating > 0 ? (
              <div className="flex items-center gap-0.5">
                <Star size={9} fill="#FBBF24" style={{ color: 'var(--star)' }} />
                <span className="text-[8px] font-bold" style={{ color: 'var(--heading)' }}>{rating.toFixed(1)}</span>
                {reviewCount > 0 && <span className="text-[7px]" style={{ color: 'var(--muted)' }}>({reviewCount})</span>}
              </div>
            ) : <div />}
            {!isOutOfStock && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full badge-instock">
                <CheckCircle2 size={7} />
                <span className="text-[6px] sm:text-[7px] font-black">In Stock</span>
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
                  className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-xl transition-all"
                  style={{
                    background: 'var(--badge-coupon-bg)',
                    border: `1px solid var(--badge-coupon-border)`,
                    boxShadow: 'var(--nm-sunken)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--badge-coupon-border)'}
                >
                  <div className="flex items-center gap-1.5">
                    <Ticket size={9} style={{ color: 'var(--accent)' }} />
                    <span className="text-[8px] font-black" style={{ color: 'var(--accent)' }}>Coupon Available</span>
                  </div>
                  <ChevronDown size={9} style={{ color: 'var(--accent)' }} />
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
