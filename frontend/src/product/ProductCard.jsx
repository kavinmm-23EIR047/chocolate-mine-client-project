import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Star, Tag, Eye, CheckCircle2, XCircle, ShoppingBag, Plus, Minus,
  Ticket, Gift, Sparkles, ChevronDown, Truck, Flame, Crown, Zap,
  Shield, Clock, Package, TrendingUp, Info, MapPin, Award, ThumbsUp
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
      className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-r-lg text-[9px] font-black tracking-wider shadow-lg",
      style: { background: 'var(--badge-bestseller-bg)', color: 'var(--badge-bestseller-text)' },
      text: "⭐ Best Seller",
      icon: <Award size={10} />
    },
    featured: {
      className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-r-lg text-[9px] font-black tracking-wider shadow-lg",
      style: { background: 'var(--badge-featured-bg)', color: 'var(--badge-featured-text)' },
      text: "🔥 Featured",
      icon: <Flame size={10} />
    },
    discount: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: { background: 'var(--badge-discount-bg)', color: 'var(--badge-discount-text)' },
      text: `${value}% OFF`
    },
    new: {
      className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-r-lg text-[9px] font-black tracking-wider shadow-lg",
      style: { background: 'var(--badge-new-bg)', color: 'var(--badge-new-text)' },
      text: "✨ New Arrival",
      icon: <Sparkles size={10} />
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
      className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider shadow-lg",
      style: { background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white' },
      text: "👑 Premium",
      icon: <Crown size={10} />
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
      {badge.icon}
      <span>{badge.text}</span>
    </div>
  );
};

// Enhanced Coupon Card with Theme Colors
const CouponCard = ({ coupon, onApply, onRemove, isApplied, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -5 }}
      className="relative rounded-xl overflow-hidden border-2 mt-2 w-full"
      style={{
        background: isApplied ? 'var(--badge-stock-bg)' : 'var(--badge-coupon-bg)',
        borderColor: isApplied ? 'var(--success)' : 'var(--accent)',
      }}
    >
      <div className="p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg" style={{ background: isApplied ? 'var(--success)' : 'var(--accent)', opacity: 0.15 }}>
              <Ticket size={14} style={{ color: isApplied ? 'var(--success)' : 'var(--accent)' }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-black" style={{ color: 'var(--heading)' }}>{coupon.code}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: isApplied ? 'var(--success)' : 'var(--accent)', color: 'white' }}>
                  {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                </span>
              </div>
              {coupon.minOrder && (
                <p className="text-[8px] text-gray-500 mt-0.5">Min order ₹{coupon.minOrder}</p>
              )}
            </div>
          </div>
          {isApplied ? (
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-[9px] font-bold px-2 py-1 rounded-lg bg-red-500/10 text-red-500 cursor-pointer transition-all hover:bg-red-500/20">
              Remove
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onApply(); }} className="px-3 py-1 text-[9px] font-black rounded-lg cursor-pointer transition-all transform hover:scale-105" style={{ background: 'var(--accent)', color: 'var(--button-text)' }}>
              Apply
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Add to Cart Button
const AddToCartBtn = ({ onClick, disabled, isOutOfStock, addingToCart, needsVariantSelection }) => {
  const label = needsVariantSelection ? 'Select Options' : addingToCart ? 'Adding...' : 'Add to Cart';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex items-center justify-center gap-2 rounded-xl h-11 sm:h-12 text-[11px] sm:text-[12px] font-bold uppercase tracking-wide transition-all transform active:scale-95 hover:scale-[0.98]"
      style={{
        background: isOutOfStock ? 'var(--card-soft)' : 'var(--button-bg)',
        color: isOutOfStock ? 'var(--muted)' : 'var(--button-text)',
        border: isOutOfStock ? '1px solid var(--border)' : 'none',
        boxShadow: isOutOfStock ? 'none' : 'var(--nm-button)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: isOutOfStock ? 0.6 : 1
      }}
    >
      <ShoppingBag size={15} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
};

// Enhanced Quick View Button
const QuickViewBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-1.5 rounded-xl h-11 sm:h-12 w-11 sm:w-12 shrink-0 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide transition-all transform hover:scale-95 cursor-pointer group"
    style={{
      background: 'var(--button-alt-bg)',
      color: 'var(--button-alt-text)',
      border: `1px solid var(--border)`,
      boxShadow: 'var(--nm-button)'
    }}
  >
    <Eye size={16} className="group-hover:rotate-12 transition-transform" />
  </button>
);

// Enhanced Quantity Selector
const QuantitySelector = ({ quantity, onIncrement, onDecrement }) => (
  <div className="flex items-center justify-between rounded-xl font-bold h-11 sm:h-12 w-full overflow-hidden" style={{ background: 'var(--card)', border: `1px solid var(--border)`, color: 'var(--heading)' }} onClick={(e) => e.stopPropagation()}>
    <button onClick={onDecrement} className="h-full px-4 flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" style={{ borderRight: `1px solid var(--border)` }}>
      <Minus size={13} />
    </button>
    <span className="text-[14px] px-3 font-black">{quantity}</span>
    <button onClick={onIncrement} className="h-full px-4 flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" style={{ borderLeft: `1px solid var(--border)` }}>
      <Plus size={13} />
    </button>
  </div>
);

// Feature Pill Component
const FeaturePill = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: 'var(--card-soft)' }}>
    <Icon size={9} style={{ color: 'var(--accent)' }} />
    <span className="text-[8px] font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
  </div>
);

const ProductCard = ({ product, layout = 'vertical', cardStyle = 'rounded-xl' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Variant tracking
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

  // Pricing calculations
  const baseMrp = activeVariant ? activeVariant.price : (product?.price || 0);
  const baseOfferPrice = !activeVariant && product?.offerPrice ? product.offerPrice : null;
  
  const hasOffer = baseOfferPrice && baseOfferPrice < baseMrp;
  const displayPrice = hasOffer ? baseOfferPrice : baseMrp;
  const mrp = baseMrp;
  const discountPct = hasOffer ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  // Coupon configuration
  const coupon = product?.coupon;
  const isCouponActive = coupon?.enabled && coupon?.code && (!coupon.endDate || new Date(coupon.endDate) > new Date());

  const handleApplyCoupon = () => { setIsCouponApplied(true); toast.success(`${coupon.code} applied! 🎉`); setShowCoupon(false); };
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

  const handleIncrement = (e) => {
    e.preventDefault(); e.stopPropagation();
    handleQuantityChange(e, cartQuantity + 1);
  };

  const handleDecrement = (e) => {
    e.preventDefault(); e.stopPropagation();
    handleQuantityChange(e, cartQuantity - 1);
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
      toast.success('Added to bag! 🛒');
    } catch (err) { toast.error('Failed to add'); } finally { setTimeout(() => setAddingToCart(false), 300); }
  };

  const wish = (e) => { e.preventDefault(); e.stopPropagation(); if (product?._id) toggleWishlist(product._id); };

  if (!product) return null;

  // ─── Horizontal Layout (List View) ───────────────────────────────
  if (layout === 'horizontal') {
    return (
      <motion.div
        layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: 4 }}
        onClick={() => navigate(`/product/${product.slug}`)}
        className={`group flex flex-row p-3 gap-4 cursor-pointer transition-all duration-300 w-full ${cardStyleMap[cardStyle]}`}
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-xl overflow-hidden" style={{ background: 'var(--surface)' }}>
          {hasValidImage && (
            <>
              {!imageLoaded && <div className="absolute inset-0 animate-pulse" style={{ background: 'var(--card-soft)' }} />}
              <img 
                src={product.image} 
                alt={product.name} 
                className={`w-full h-full object-cover object-center transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy" 
              />
            </>
          )}
          {!hasValidImage && <ImagePlaceholder />}
          
          {isCakeCategory && (
            <div className="absolute bottom-2 left-2 z-10">
              <ProductBadge type="veg" />
            </div>
          )}

          <button onClick={wish} className="absolute top-2 right-2 p-1.5 rounded-full shadow-lg z-10 bg-white/90 backdrop-blur-sm hover:bg-white transition-all">
            <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} style={{ color: isLiked ? '#ef4444' : '#666' }} />
          </button>
          {product.bestseller && <ProductBadge type="bestseller" absolute />}
        </div>
        
        <div className="flex flex-col flex-1 min-w-0 justify-between py-1">
          <div className="space-y-1.5">
            <h3 className="text-[14px] sm:text-[15px] font-semibold leading-tight line-clamp-2" style={{ color: 'var(--heading)' }}>{product.name}</h3>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[16px] sm:text-[17px] font-black" style={{ color: 'var(--heading)' }}>₹{Math.round(finalPrice)}</span>
              {(hasOffer || isCouponApplied) && (
                <>
                  <span className="text-[11px] sm:text-[12px] font-medium line-through text-gray-400">₹{isCouponApplied ? displayPrice : mrp}</span>
                  {discountPct > 0 && (
                    <span className="text-[11px] sm:text-[12px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--badge-discount-bg)', color: 'var(--badge-discount-text)' }}>
                      {discountPct}% OFF
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Features Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.deliveryTime && <FeaturePill icon={Clock} label={`${product.deliveryTime} mins`} />}
              {product.isFreeDelivery && <FeaturePill icon={Truck} label="Free Delivery" />}
            </div>

            {hasVariants && product.variants.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap py-1" onClick={(e) => e.stopPropagation()}>
                {product.variants.map((v, idx) => (
                  <button key={idx} onClick={() => setSelectedVariantIndex(idx)}
                    className="px-2 py-1 rounded-lg text-[9px] font-bold border transition-all transform hover:scale-105"
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
              <div className="flex flex-col gap-1.5 items-start">
                <button onClick={(e) => { e.stopPropagation(); setShowCoupon(!showCoupon); }} 
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-all hover:scale-105"
                  style={{ background: 'var(--badge-stock-bg)', color: 'var(--accent)' }}>
                  <Ticket size={11} /> 
                  {isCouponApplied ? '🎉 Coupon Applied!' : `Save with ${coupon.code}`}
                  <ChevronDown size={9} className={`transition-transform ${showCoupon ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showCoupon && (
                    <CouponCard coupon={coupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} isApplied={isCouponApplied} />
                  )}
                </AnimatePresence>
              </div>
            )}

            {rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg" style={{ background: '#22c55e', color: 'white' }}>
                  <Star size={9} fill="white" />
                  <span className="text-[10px] font-bold">{rating.toFixed(1)}</span>
                </div>
                <span className="text-[10px] font-medium text-gray-500">({reviewCount} reviews)</span>
                <ThumbsUp size={9} className="text-gray-400" />
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[10px] font-medium">
              <MapPin size={10} className="text-gray-400 shrink-0" />
              <span className="capitalize text-gray-500">{product.location || 'coimbatore'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            {cartQuantity > 0 ? 
              <QuantitySelector quantity={cartQuantity} onIncrement={handleIncrement} onDecrement={handleDecrement} /> : 
              <AddToCartBtn onClick={handleInitialAdd} disabled={isOutOfStock} isOutOfStock={isOutOfStock} addingToCart={addingToCart} needsVariantSelection={false} />
            }
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Vertical Layout (Grid View - Enhanced) ─────────────────────
  return (
    <motion.div
      layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}
      onClick={() => navigate(`/product/${product.slug}`)}
      className={`group h-full flex flex-col transition-all duration-300 overflow-hidden w-full ${cardStyleMap[cardStyle]} hover:shadow-xl`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Image Container with Overlay Effects */}
      <div className="relative aspect-square overflow-hidden shrink-0 w-full" style={{ background: 'var(--surface)' }}>
        {hasValidImage && (
          <>
            {!imageLoaded && <div className="absolute inset-0 animate-pulse" style={{ background: 'var(--card-soft)' }} />}
            <img 
              src={product.image} 
              alt={product.name} 
              className={`w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy" 
            />
          </>
        )}
        {!hasValidImage && <ImagePlaceholder />}
        
        {/* Image Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {isCakeCategory && (
          <div className="absolute bottom-2 left-2 z-10">
            <ProductBadge type="veg" />
          </div>
        )}

        {/* Wishlist Button - Enhanced */}
        <button onClick={wish} className="absolute top-2 right-2 p-1.5 rounded-full shadow-lg z-10 bg-white/90 backdrop-blur-sm hover:bg-white transition-all transform hover:scale-110">
          <Heart size={15} fill={isLiked ? '#ef4444' : 'none'} style={{ color: isLiked ? '#ef4444' : '#666' }} />
        </button>

        {/* Badge Stack */}
        <div className="absolute top-2 left-0 z-10 flex flex-col gap-1">
          {product.bestseller && <ProductBadge type="bestseller" absolute />}
          {!product.bestseller && product.featured && <ProductBadge type="featured" absolute />}
          {!product.bestseller && !product.featured && product.new && <ProductBadge type="new" absolute />}
          {product.premium && <ProductBadge type="premium" absolute />}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-[11px] font-black text-white px-3 py-1.5 rounded-full shadow-lg bg-red-600 border border-red-400 uppercase tracking-widest">
              Sold Out
            </span>
          </div>
        )}

        {/* Quick View Overlay */}
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.slug}`); }}
          className="absolute inset-x-4 bottom-3 py-2 rounded-xl backdrop-blur-md bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
        >
          Quick View
        </button>
      </div>

      {/* Content Section */}
      <div className="p-3 flex flex-col flex-1 text-left">
        {/* Title with Brand/Store */}
        <div className="mb-1">
          {product.storeName && (
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>{product.storeName}</span>
          )}
          <h3 className="text-[13px] sm:text-[14px] font-semibold leading-snug line-clamp-2 mt-0.5" style={{ color: 'var(--heading)' }}>
            {product.name}
          </h3>
        </div>

        {/* Pricing Row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          <span className="text-[15px] sm:text-[17px] font-black" style={{ color: 'var(--heading)' }}>₹{Math.round(finalPrice)}</span>
          {(hasOffer || isCouponApplied) && (
            <>
              <span className="text-[10px] sm:text-[11px] line-through text-gray-400">₹{isCouponApplied ? displayPrice : mrp}</span>
              {discountPct > 0 && (
                <span className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--badge-discount-bg)', color: 'var(--badge-discount-text)' }}>
                  {discountPct}% OFF
                </span>
              )}
            </>
          )}
        </div>

        {/* Features Row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {product.deliveryTime && <FeaturePill icon={Clock} label={`${product.deliveryTime} min`} />}
          {product.isFreeDelivery && <FeaturePill icon={Truck} label="Free Delivery" />}
        </div>

        {/* Variant Selector - Enhanced */}
        {hasVariants && product.variants.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-2" onClick={(e) => e.stopPropagation()}>
            {product.variants.map((v, idx) => (
              <button key={idx} onClick={() => setSelectedVariantIndex(idx)}
                className="px-2 py-1 rounded-lg text-[9px] font-bold transition-all transform hover:scale-105 active:scale-95"
                style={{
                  background: selectedVariantIndex === idx ? 'var(--primary)' : 'var(--card-soft)',
                  color: selectedVariantIndex === idx ? 'var(--button-text)' : 'var(--heading)',
                  border: selectedVariantIndex === idx ? 'none' : `1px solid var(--border)`
                }}>
                {v.weight}
              </button>
            ))}
          </div>
        )}

        {/* Coupon Section */}
        {isCouponActive && (
          <div className="mb-2 flex flex-col items-start w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowCoupon(!showCoupon)} 
              className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-all"
              style={{ background: 'var(--badge-stock-bg)', color: 'var(--accent)' }}>
              <Ticket size={11} />
              <span>{isCouponApplied ? '🎉 Coupon Applied!' : `Use ${coupon.code}`}</span>
              <ChevronDown size={9} className={`transition-transform duration-200 ${showCoupon ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showCoupon && (
                <CouponCard coupon={coupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} isApplied={isCouponApplied} />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Rating Section */}
        <div className="flex items-center gap-1.5 mb-2">
          {rating > 0 ? (
            <>
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg" style={{ background: '#22c55e', color: 'white' }}>
                <Star size={9} fill="white" />
                <span className="text-[10px] font-bold">{rating.toFixed(1)}</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-medium text-gray-500">({reviewCount} reviews)</span>
            </>
          ) : (
            <span className="text-[9px] text-gray-400 italic">No reviews yet</span>
          )}
        </div>

        {/* Location & Delivery Info */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1">
            <MapPin size={10} className="text-gray-400 shrink-0" />
            <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium capitalize truncate max-w-[100px]">
              {product.location || 'coimbatore'}
            </span>
          </div>
          {product.distance && (
            <span className="text-[9px] text-gray-400">{product.distance} km</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full mt-3">
          <QuickViewBtn onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.slug}`); }} />
          {cartQuantity > 0 ? 
            <QuantitySelector quantity={cartQuantity} onIncrement={handleIncrement} onDecrement={handleDecrement} /> : 
            <AddToCartBtn onClick={handleInitialAdd} disabled={isOutOfStock} isOutOfStock={isOutOfStock} addingToCart={addingToCart} needsVariantSelection={false} />
          }
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
