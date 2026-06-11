import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Star, Tag, Eye, CheckCircle2, XCircle, ShoppingBag, Plus, Minus,
  Ticket, Gift, Sparkles, ChevronDown, Truck, Flame, Crown, Zap,
  Shield, Clock, Package, TrendingUp, Info, MapPin
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

// Swiggy Veg Icon Box (Matches exactly without using breaking light background utilities)
const ProductBadge = ({ type, value = "", absolute = false }) => {
  const badgeStyles = {
    veg: {
      className: "inline-flex items-center justify-center shrink-0 p-0.5 rounded border border-[#3a3028]",
      style: { background: 'var(--card)' }
    },
    bestseller: {
      className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-black tracking-wider uppercase shadow-sm",
      style: { background: 'var(--badge-bestseller-bg)', color: 'var(--badge-bestseller-text)' },
      text: "Best Seller"
    },
    featured: {
      className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-black tracking-wider uppercase shadow-sm",
      style: { background: 'var(--badge-featured-bg)', color: 'var(--badge-featured-text)' },
      text: "Featured"
    },
    discount: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider",
      style: { background: 'var(--badge-discount-bg)', color: 'var(--badge-discount-text)' },
      text: `${value}% OFF`
    },
    new: {
      className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-black tracking-wider uppercase shadow-sm",
      style: { background: 'var(--badge-new-bg)', color: 'var(--badge-new-text)' },
      text: "New"
    },
    limited: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider",
      style: { background: 'var(--badge-limited-bg)', color: 'var(--badge-limited-text)' },
      text: "Limited"
    },
    eggless: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider",
      style: { background: 'var(--badge-stock-bg)', color: 'var(--badge-stock-text)' },
      text: "Eggless"
    },
    premium: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider",
      style: { background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white' },
      text: "Premium"
    }
  };

  if (type === 'veg') {
    return (
      <div className={badgeStyles.veg.className} style={badgeStyles.veg.style}>
        <div className="w-3 h-3 border-2 border-green-600 flex items-center justify-center bg-transparent rounded-[2px] p-[1px]">
          <div className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
        </div>
      </div>
    );
  }

  const badge = badgeStyles[type];
  if (!badge) return null;

  return (
    <div
      className={`${badge.className} ${absolute ? 'absolute top-2 left-2 z-10' : ''}`}
      style={badge.style}
    >
      <span>{badge.text}</span>
    </div>
  );
};

const CouponCard = ({ coupon, onApply, onRemove, isApplied }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="relative rounded border border-dashed mt-1.5 w-full overflow-hidden"
      style={{
        background: isApplied ? 'var(--badge-stock-bg)' : 'var(--badge-coupon-bg)',
        borderColor: isApplied ? 'var(--success)' : 'var(--accent)',
      }}
    >
      <div className="p-2 flex items-center justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-mono font-black tracking-wide" style={{ color: 'var(--heading)' }}>{coupon.code}</div>
          <div className="text-[8px] font-medium mt-0.5" style={{ color: 'var(--muted)' }}>
            {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
          </div>
        </div>
        {isApplied ? (
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-[9px] font-black text-red-500 cursor-pointer uppercase tracking-wider">Remove</button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onApply(); }} className="px-2 py-1 text-[9px] font-black rounded cursor-pointer uppercase tracking-wider" style={{ background: 'var(--accent)', color: 'var(--button-text)' }}>Apply</button>
        )}
      </div>
    </motion.div>
  );
};

// ─── Swiggy Custom Overlay Action Button Unit ──────────────────────────────────────
// This renders overlapping the bottom center edge of the item image.
// Safely checks quantity value and hooks up handlers.
const SwiggyCartAction = ({ cartQuantity, handleQuantityChange, handleInitialAdd, isOutOfStock, addingToCart }) => {
  const label = addingToCart ? '...' : 'ADD';
  
  if (isOutOfStock) {
    return (
      <div 
        className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-20 border text-[9px] font-black px-3 py-1 rounded shadow-md whitespace-nowrap uppercase tracking-wider"
        style={{ background: 'var(--card-soft)', borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        Sold Out
      </div>
    );
  }

  // Active Increment/Decrement Mode (Triggers immediately when item added)
  if (cartQuantity > 0) {
    return (
      <div 
        className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-between border shadow-lg rounded-md h-7.5 w-[84px] font-bold overflow-hidden transition-all duration-200"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={(e) => handleQuantityChange(e, cartQuantity - 1)} 
          className="h-full px-2 flex items-center justify-center transition-colors active:scale-90 cursor-pointer"
          style={{ color: 'var(--accent)' }}
        >
          <Minus size={11} strokeWidth={3} />
        </button>
        <span className="text-[12px] font-black" style={{ color: 'var(--accent)' }}>{cartQuantity}</span>
        <button 
          onClick={(e) => handleQuantityChange(e, cartQuantity + 1)} 
          className="h-full px-2 flex items-center justify-center transition-colors active:scale-90 cursor-pointer"
          style={{ color: 'var(--accent)' }}
        >
          <Plus size={11} strokeWidth={3} />
        </button>
      </div>
    );
  }

  // Baseline resting state
  return (
    <button
      onClick={handleInitialAdd}
      className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center border shadow-md hover:shadow-lg rounded-md h-7.5 w-[84px] text-[12px] font-extrabold tracking-wider transition-all active:scale-95 cursor-pointer"
      style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--accent)' }}
    >
      <span>{label}</span>
    </button>
  );
};

const ProductCard = ({ product, layout = 'vertical', cardStyle = 'rounded-lg' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  const hasVariants = product?.hasVariants || (product?.variants && product.variants.length > 0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const activeVariant = hasVariants && product.variants ? product.variants[selectedVariantIndex] : null;

  const cartItems = useSelector((state) => state.cart?.items || []);
  
  const currentCartItem = cartItems.find(item => {
    const standardMatch = item.product?._id === product?._id || item._id === product?._id;
    if (standardMatch && activeVariant) {
      return item.options?.flavor === activeVariant.flavor && item.options?.weight === activeVariant.weight;
    }
    return standardMatch;
  });
  
  const cartQuantity = currentCartItem ? currentCartItem.qty : 0;
  const isLiked = product?._id ? isInWishlist(product._id) : false;

  const cardStyleMap = {
    'rounded-sm': 'rounded-sm',
    'rounded-md': 'rounded-md',
    'rounded-lg': 'rounded-lg',
    'rounded-xl': 'rounded-xl',
  };

  const baseMrp = activeVariant ? activeVariant.price : (product?.price || 0);
  const baseOfferPrice = !activeVariant && product?.offerPrice ? product.offerPrice : null;
  
  const hasOffer = baseOfferPrice && baseOfferPrice < baseMrp;
  const displayPrice = hasOffer ? baseOfferPrice : baseMrp;
  const mrp = baseMrp;
  const discountPct = hasOffer ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  const coupon = product?.coupon;
  const isCouponActive = coupon?.enabled && coupon?.code && (!coupon.endDate || new Date(coupon.endDate) > new Date());

  const handleApplyCoupon = () => { setIsCouponApplied(true); toast.success(`${coupon.code} applied!`); setShowCoupon(false); };
  const handleRemoveCoupon = () => { setIsCouponApplied(false); toast.success(`${coupon.code} removed`); };

  const finalPrice = isCouponApplied && isCouponActive
    ? coupon.type === 'percent' ? displayPrice - (displayPrice * coupon.value / 100) : Math.max(0, displayPrice - coupon.value)
    : displayPrice;

  const isOutOfStock = activeVariant ? activeVariant.stock === false : product?.stock === false;
  
  const rating = Number(product?.ratingsAverage) || 0;
  const reviewCount = Number(product?.ratingsCount) || 0;
  const isCakeCategory = String(product?.category || '').toLowerCase().includes('cake') || !!product?.cakeType;
  const hasValidImage = typeof product?.image === 'string' && product.image.trim() !== '' && product.image !== 'none';

  const handleQuantityChange = (e, newQty) => {
    e.preventDefault(); e.stopPropagation();
    if (newQty < 0) return;
    const matchId = currentCartItem?._id || product?._id;
    if (!matchId) return;
    if (newQty === 0) { 
      dispatch(removeFromCart(matchId)); 
      toast.success('Removed from bag'); 
    } else { 
      dispatch(updateCartQty({ productId: matchId, qty: newQty })); 
    }
  };

  const handleInitialAdd = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isOutOfStock || !product) return;
    
    try {
      setAddingToCart(true);
      dispatch(addToCart({
        product: product, 
        qty: 1,
        options: activeVariant ? { flavor: activeVariant.flavor, weight: activeVariant.weight } : null,
        variantPrice: activeVariant ? activeVariant.price : null
      }));
      toast.success('Added to bag');
    } catch (err) { toast.error('Failed to add'); } finally { setTimeout(() => setAddingToCart(false), 300); }
  };

  const wish = (e) => { e.preventDefault(); e.stopPropagation(); if (product?._id) toggleWishlist(product._id); };

  if (!product) return null;

  // ─── Swiggy Mobile Layout (Horizontal Single-Row Card Stream) ─────────────────────
  if (layout === 'horizontal') {
    return (
      <motion.div
        layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate(`/product/${product.slug}`)}
        className="flex flex-row p-4 gap-4 items-start cursor-pointer w-full border-b transition-colors"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Descriptive Text Meta Columns */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {isCakeCategory && <ProductBadge type="veg" />}
            {product.bestseller && (
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wide">★ Bestseller</span>
            )}
          </div>

          <h3 className="text-[14px] font-bold leading-tight line-clamp-2" style={{ color: 'var(--heading)' }}>
            {product.name}
          </h3>

          {/* Pricing Row */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[14px] font-extrabold" style={{ color: 'var(--heading)' }}>₹{Math.round(finalPrice)}</span>
            {(hasOffer || isCouponApplied) && (
              <>
                <span className="text-[10px] line-through" style={{ color: 'var(--muted)' }}>₹{isCouponApplied ? displayPrice : mrp}</span>
                {discountPct > 0 && <span className="text-[10px] font-bold text-orange-400">{discountPct}% OFF</span>}
              </>
            )}
          </div>

          {/* Quality Indicator Row */}
          {rating > 0 ? (
            <div className="flex items-center gap-0.5 mt-1 text-[11px] font-bold text-green-500">
              <Star size={11} fill="currentColor" />
              <span>{rating.toFixed(1)}</span>
              {reviewCount > 0 && <span className="font-medium text-[10px] ml-1" style={{ color: 'var(--muted)' }}>({reviewCount})</span>}
            </div>
          ) : (
            <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>Unrated</div>
          )}

          {/* Sizing Controls and Promotional Links */}
          <div className="flex flex-col gap-1.5 mt-2">
            {hasVariants && product.variants.length > 1 && (
              <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                {product.variants.map((v, idx) => (
                  <button key={idx} onClick={() => setSelectedVariantIndex(idx)}
                    className="px-2 py-0.5 rounded text-[9px] font-semibold border transition-all cursor-pointer"
                    style={{
                      background: selectedVariantIndex === idx ? 'var(--primary)' : 'var(--card-soft)',
                      color: selectedVariantIndex === idx ? 'var(--button-text)' : 'var(--heading)',
                      borderColor: selectedVariantIndex === idx ? 'var(--primary)' : 'var(--border)'
                    }}>
                    {v.weight}
                  </button>
                ))}
              </div>
            )}

            {isCouponActive && (
              <div className="inline-block mt-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowCoupon(!showCoupon)} 
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-green-500 bg-green-950/20 px-1.5 py-0.5 rounded border"
                  style={{ borderColor: 'var(--border)' }}>
                  <Ticket size={10} /> {isCouponApplied ? 'Applied' : `Use: ${coupon.code}`} <ChevronDown size={8} />
                </button>
                <AnimatePresence>{showCoupon && <CouponCard coupon={coupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} isApplied={isCouponApplied} />}</AnimatePresence>
              </div>
            )}

            <div className="flex items-center gap-1 text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
              <MapPin size={10} />
              <span className="capitalize">{product.location || 'coimbatore'}</span>
            </div>
          </div>
        </div>

        {/* Floating Right Image Cover Module */}
        <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="w-full h-full overflow-hidden rounded-xl">
            {hasValidImage ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" /> : <ImagePlaceholder />}
          </div>
          
          <button onClick={wish} className="absolute top-1.5 right-1.5 p-1.5 rounded-full shadow-sm z-10 transition-all border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Heart size={12} fill={isLiked ? '#ef4444' : 'none'} style={{ color: isLiked ? '#ef4444' : 'var(--heading)' }} />
          </button>

          {/* Dynamic Quantity Overlay Action Area */}
          <SwiggyCartAction 
            cartQuantity={cartQuantity}
            handleQuantityChange={handleQuantityChange}
            handleInitialAdd={handleInitialAdd}
            isOutOfStock={isOutOfStock}
            addingToCart={addingToCart}
          />
        </div>
      </motion.div>
    );
  }

  // ─── Swiggy Desktop Layout (Grid Display Structure) ───────────────────────────────
  return (
    <motion.div
      layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate(`/product/${product.slug}`)}
      className={`group h-full flex flex-col cursor-pointer transition-all duration-200 p-3 ${cardStyleMap[cardStyle]}`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Top Image Framing Workspace */}
      <div className="relative aspect-square overflow-visible shrink-0 w-full mb-5" style={{ background: 'var(--surface)', borderRadius: '12px' }}>
        <div className="w-full h-full overflow-hidden rounded-xl">
          {hasValidImage ? <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-300" loading="lazy" /> : <ImagePlaceholder />}
        </div>
        
        {/* Dynamic Category Badging Layer */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isCakeCategory && <ProductBadge type="veg" />}
          {product.bestseller && <ProductBadge type="bestseller" />}
          {!product.bestseller && product.featured && <ProductBadge type="featured" />}
        </div>

        {/* Bookmark/Wishlist Element */}
        <button onClick={wish} className="absolute top-2 right-2 p-1.5 rounded-full shadow-sm z-10 transition-all border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} style={{ color: isLiked ? '#ef4444' : 'var(--heading)' }} />
        </button>

        {/* Dynamic Overlay Control */}
        <SwiggyCartAction 
          cartQuantity={cartQuantity}
          handleQuantityChange={handleQuantityChange}
          handleInitialAdd={handleInitialAdd}
          isOutOfStock={isOutOfStock}
          addingToCart={addingToCart}
        />
      </div>

      {/* Typography Description Segment */}
      <div className="flex flex-col flex-1 text-left mt-1">
        <h3 className="text-[14px] font-bold leading-tight line-clamp-1 mb-0.5" style={{ color: 'var(--heading)' }}>
          {product.name}
        </h3>

        {/* Location & Rating Headers */}
        <div className="flex items-center gap-1 text-[12px] font-medium mb-1" style={{ color: 'var(--muted)' }}>
          {rating > 0 ? (
            <div className="flex items-center gap-0.5 font-bold text-green-500">
              <Star size={12} fill="currentColor" />
              <span>{rating.toFixed(1)}</span>
            </div>
          ) : (
            <span>Unrated</span>
          )}
          <span>•</span>
          <span className="capitalize truncate">{product.location || 'coimbatore'}</span>
        </div>

        {/* Pricing Layout Block */}
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          <span className="text-[15px] font-black" style={{ color: 'var(--heading)' }}>₹{Math.round(finalPrice)}</span>
          {(hasOffer || isCouponApplied) && (
            <>
              <span className="text-[11px] line-through" style={{ color: 'var(--muted)' }}>₹{isCouponApplied ? displayPrice : mrp}</span>
              {discountPct > 0 && <span className="text-[11px] font-bold text-orange-400">{discountPct}% OFF</span>}
            </>
          )}
        </div>

        {/* Sub-variant Selector Panels */}
        {hasVariants && product.variants.length > 1 && (
          <div className="flex items-center gap-1 flex-wrap mt-2" onClick={(e) => e.stopPropagation()}>
            {product.variants.map((v, idx) => (
              <button key={idx} onClick={() => setSelectedVariantIndex(idx)}
                className="px-1.5 py-0.5 rounded text-[8px] font-black border transition-all cursor-pointer"
                style={{
                  background: selectedVariantIndex === idx ? 'var(--primary)' : 'var(--card-soft)',
                  color: selectedVariantIndex === idx ? 'var(--button-text)' : 'var(--heading)',
                  borderColor: selectedVariantIndex === idx ? 'var(--primary)' : 'var(--border)'
                }}>
                {v.weight}
              </button>
            ))}
          </div>
        )}

        {/* Micro Coupon Controls */}
        {isCouponActive && (
          <div className="mt-2 w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowCoupon(!showCoupon)} className="flex items-center gap-1 text-[9px] font-bold text-green-500 bg-green-950/20 px-1.5 py-0.5 rounded border cursor-pointer" style={{ borderColor: 'var(--border)' }}>
              <Ticket size={10} className="shrink-0" />
              <span>{isCouponApplied ? 'Code Active! 🎉' : `Code: ${coupon.code}`}</span>
              <ChevronDown size={8} />
            </button>
            <AnimatePresence>{showCoupon && <CouponCard coupon={coupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} isApplied={isCouponApplied} />}</AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
