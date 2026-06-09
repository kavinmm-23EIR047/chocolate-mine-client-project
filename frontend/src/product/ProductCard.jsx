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

// Enhanced Badge Component with Theme Colors
const ProductBadge = ({ type, value = "", absolute = false }) => {
  const badgeStyles = {
    veg: {
      className: "inline-flex items-center justify-center shrink-0 p-0.5 rounded bg-[#1e1a17] border border-[#3a3028]",
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
      <div className={badgeStyles.veg.className}>
        <div className="w-3.5 h-3.5 border-2 border-green-600 flex items-center justify-center bg-transparent rounded-[3px] p-[1px]">
          <div className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
        </div>
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
      className="relative rounded-lg overflow-hidden border-l-4 mt-1.5 w-full"
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
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-[8px] font-bold text-red-500 cursor-pointer">Remove</button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onApply(); }} className="px-2 py-0.5 text-[8px] font-black rounded-md cursor-pointer" style={{ background: 'var(--accent)', color: 'var(--button-text)' }}>Apply</button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Add to Cart Button
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
      <span>{label}</span>
    </button>
  );
};

// Quick View Button
const QuickViewBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-1 rounded-lg h-10 sm:h-11 shrink-0 px-2.5 sm:px-3.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95 cursor-pointer"
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
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  // 1. Full Variant Tracking Setup
  const hasVariants = product?.hasVariants || (product?.variants && product.variants.length > 0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const activeVariant = hasVariants && product.variants ? product.variants[selectedVariantIndex] : null;

  const cartItems = useSelector((state) => state.cart?.items || []);
  
  // Track cart matching variant dimensions if applicable
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

  // 2. Pricing Calculations based on regular vs variant architecture
  const baseMrp = activeVariant ? activeVariant.price : (product?.price || 0);
  const baseOfferPrice = !activeVariant && product?.offerPrice ? product.offerPrice : null;
  
  const hasOffer = baseOfferPrice && baseOfferPrice < baseMrp;
  const displayPrice = hasOffer ? baseOfferPrice : baseMrp;
  const mrp = baseMrp;
  const discountPct = hasOffer ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  // Coupon configuration
  const coupon = product?.coupon;
  const isCouponActive = coupon?.enabled && coupon?.code && (!coupon.endDate || new Date(coupon.endDate) > new Date());

  const handleApplyCoupon = () => { setIsCouponApplied(true); toast.success(`${coupon.code} applied!`); setShowCoupon(false); };
  const handleRemoveCoupon = () => { setIsCouponApplied(false); toast.success(`${coupon.code} removed`); };

  const finalPrice = isCouponApplied && isCouponActive
    ? coupon.type === 'percent' ? displayPrice - (displayPrice * coupon.value / 100) : Math.max(0, displayPrice - coupon.value)
    : displayPrice;

  // 3. Stock computation linked to active variant status
  const isOutOfStock = activeVariant ? activeVariant.stock === false : product?.stock === false;
  
  const rating = Number(product?.ratingsAverage) || 0;
  const reviewCount = Number(product?.ratingsCount) || 0;

  // Cake-specific checks
  const isCakeCategory = String(product?.category || '').toLowerCase().includes('cake') || !!product?.cakeType;

  // Runtime Safe Image Validation
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

  const QuantitySelector = () => (
    <div className="flex items-center justify-between rounded-lg font-bold h-10 sm:h-11 w-full" style={{ background: 'var(--card)', border: `1px solid var(--border)`, color: 'var(--heading)' }} onClick={(e) => e.stopPropagation()}>
      <button onClick={(e) => handleQuantityChange(e, cartQuantity - 1)} className="h-full px-3 sm:px-4 flex items-center justify-center transition-colors rounded-l-lg cursor-pointer" style={{ borderRight: `1px solid var(--border)` }}>
        <Minus size={12} />
      </button>
      <span className="text-[12px] px-2 font-black">{cartQuantity}</span>
      <button onClick={(e) => handleQuantityChange(e, cartQuantity + 1)} className="h-full px-3 sm:px-4 flex items-center justify-center transition-colors rounded-r-lg cursor-pointer" style={{ borderLeft: `1px solid var(--border)` }}>
        <Plus size={12} />
      </button>
    </div>
  );

  if (!product) return null;

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
          
          {/* Veg badge repositioned to bottom left corner over the image layer */}
          {isCakeCategory && (
            <div className="absolute bottom-2 left-2 z-10">
              <ProductBadge type="veg" />
            </div>
          )}

          {/* Solid White round action container replacing glassmorphism transparency */}
          <button onClick={wish} className="absolute top-1.5 right-1.5 p-1.5 rounded-full shadow-sm z-10 bg-white hover:bg-gray-100 transition-colors">
            <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} style={{ color: isLiked ? '#ef4444' : '#666' }} />
          </button>
          {product.bestseller && <ProductBadge type="bestseller" absolute />}
        </div>
        <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
          <div className="space-y-1">
            <h3 className="text-[13px] sm:text-[14px] font-semibold leading-snug line-clamp-2" style={{ color: 'var(--heading)' }}>{product.name}</h3>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[14px] sm:text-[15px] font-black" style={{ color: 'var(--heading)' }}>₹{Math.round(finalPrice)}</span>
              {(hasOffer || isCouponApplied) && (
                <>
                  <span className="text-[10px] sm:text-[11px] font-medium line-through text-gray-400">₹{isCouponApplied ? displayPrice : mrp}</span>
                  {discountPct > 0 && <span className="text-[10px] sm:text-[11px] font-bold text-orange-500">{discountPct}% OFF</span>}
                </>
              )}
            </div>

            {/* Live Variant Weight Badges/Selectors */}
            {hasVariants && product.variants.length > 1 && (
              <div className="flex items-center gap-1 flex-wrap py-0.5" onClick={(e) => e.stopPropagation()}>
                {product.variants.map((v, idx) => (
                  <button key={idx} onClick={() => setSelectedVariantIndex(idx)}
                    className="px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all"
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
              <div className="flex flex-col gap-1 items-start">
                <button onClick={(e) => { e.stopPropagation(); setShowCoupon(!showCoupon); }} 
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded cursor-pointer">
                  <Ticket size={10} /> {isCouponApplied ? 'Coupon Applied! 🎉' : `Use code: ${coupon.code}`} <ChevronDown size={8} />
                </button>
                <AnimatePresence>
                  {showCoupon && (
                    <CouponCard coupon={coupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} isApplied={isCouponApplied} />
                  )}
                </AnimatePresence>
              </div>
            )}

            {rating > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="bg-green-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 text-[10px] font-bold">
                  <Star size={9} fill="white" /> {rating.toFixed(1)}
                </span>
                {reviewCount > 0 && <span className="text-[10px] text-gray-500 font-medium">({reviewCount} Reviews)</span>}
              </div>
            )}

            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium mt-1">
              <MapPin size={10} className="text-gray-400 shrink-0" />
              <span className="capitalize">{product.location || 'coimbatore'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
             {cartQuantity > 0 ? <div className="flex-1"><QuantitySelector /></div> : <AddToCartBtn onClick={handleInitialAdd} disabled={isOutOfStock} isOutOfStock={isOutOfStock} addingToCart={addingToCart} needsVariantSelection={false} />}
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
      {/* Image Container */}
      <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden shrink-0 w-full" style={{ background: 'var(--surface)' }}>
        {hasValidImage ? <img src={product.image} alt={product.name} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <ImagePlaceholder />}
        
        {/* FIX Applied: Pure veg icon shifts securely to bottom left to dodge layout overlapping */}
        {isCakeCategory && (
          <div className="absolute bottom-2 left-2 z-10">
            <ProductBadge type="veg" />
          </div>
        )}

        {/* Floating Heart Top Right - Configured with solid layout block backing */}
        <button onClick={wish} className="absolute top-2 right-2 p-1.5 rounded-full shadow-sm z-10 bg-white hover:bg-gray-100 transition-colors">
          <Heart size={16} fill={isLiked ? '#ef4444' : 'none'} style={{ color: isLiked ? '#ef4444' : '#666' }} />
        </button>

        {/* Floating Badge Top Left */}
        {product.bestseller && <ProductBadge type="bestseller" absolute />}
        {!product.bestseller && product.featured && <ProductBadge type="featured" absolute />}
        {!product.bestseller && !product.featured && product.new && <ProductBadge type="new" absolute />}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-[#000000]/60 flex items-center justify-center">
            <span className="text-[10px] font-black text-red-600 px-2 py-1 rounded shadow-sm bg-white border border-red-200 uppercase tracking-widest">Sold Out</span>
          </div>
        )}
      </div>

      {/* Content Aligned Left */}
      <div className="p-2 sm:p-3 flex flex-col flex-1 text-left">
        {/* Title */}
        <h3 className="text-[12px] sm:text-[14px] font-medium leading-snug line-clamp-1 mb-1" style={{ color: 'var(--heading)' }}>
          {product.name}
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

        {/* Inline Weight Toggles */}
        {hasVariants && product.variants.length > 1 && (
          <div className="flex items-center gap-1 flex-wrap mb-1.5" onClick={(e) => e.stopPropagation()}>
            {product.variants.map((v, idx) => (
              <button key={idx} onClick={() => setSelectedVariantIndex(idx)}
                className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black border transition-all cursor-pointer"
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

        {/* Coupon Interactive View */}
        {isCouponActive && (
          <div className="mb-1.5 flex flex-col items-start w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowCoupon(!showCoupon)} className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded self-start cursor-pointer">
              <Ticket size={11} className="shrink-0" />
              <span>{isCouponApplied ? 'Code Applied! 🎉' : `Use code: ${coupon.code}`}</span>
              <ChevronDown size={8} />
            </button>
            <AnimatePresence>
              {showCoupon && (
                <CouponCard coupon={coupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} isApplied={isCouponApplied} />
              )}
            </AnimatePresence>
          </div>
        )}

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

        {/* Location Info */}
        <div className="flex items-center gap-1 mt-auto pb-2 border-b border-gray-100 dark:border-gray-800">
           <MapPin size={11} className="text-gray-400 shrink-0" />
           <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium capitalize">
             Location: <strong className="font-semibold text-gray-700 dark:text-gray-300">{product.location || 'coimbatore'}</strong>
           </span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full mt-2">
          <QuickViewBtn onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.slug}`); }} />
          {cartQuantity > 0 ? (
            <div className="flex-1"><QuantitySelector /></div>
          ) : (
            <AddToCartBtn onClick={handleInitialAdd} disabled={isOutOfStock} isOutOfStock={isOutOfStock} addingToCart={addingToCart} needsVariantSelection={false} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
