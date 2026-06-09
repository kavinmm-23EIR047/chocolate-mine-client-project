import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Star, Eye, ShoppingBag, Plus, Minus, Ticket, ChevronDown, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart, updateCartQty } from '../redux/slices/cartSlice';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';

const ImagePlaceholder = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-[#241b15]">
    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#16110e] border border-[#2d241e]">
      <ShoppingBag className="w-4 h-4 text-gray-500" />
    </div>
    <span className="text-[9px] font-black uppercase tracking-widest mt-2 text-gray-500">Artisan</span>
  </div>
);

// Enhanced Badge Component with Solid Theme Colors
const ProductBadge = ({ type, value = "", absolute = false }) => {
  const badgeStyles = {
    veg: {
      className: "inline-flex items-center justify-center shrink-0 p-0.5 rounded bg-[#1e1a17] border border-[#3a3028]",
    },
    bestseller: {
      className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider shadow-md uppercase",
      style: { background: '#F2C94C', color: '#1E1A17' },
      text: "Best Seller"
    },
    featured: {
      className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider shadow-md uppercase",
      style: { background: 'var(--badge-featured-bg)', color: 'var(--badge-featured-text)' },
      text: "Featured"
    },
    discount: {
      className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
      style: { background: 'var(--badge-discount-bg)', color: 'var(--badge-discount-text)' },
      text: `${value}% OFF`
    },
    new: {
      className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider shadow-md uppercase",
      style: { background: 'var(--badge-new-bg)', color: 'var(--badge-new-text)' },
      text: "New"
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
      className={`${badge.className} ${absolute ? 'absolute top-2 left-2 z-10' : ''}`}
      style={badge.style}
    >
      <span>{badge.text}</span>
    </div>
  );
};

// Compact Coupon Card with Solid UI
const CouponCard = ({ coupon, onApply, onRemove, isApplied }) => {
  return (
    <motion.div
      initial={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="relative rounded-lg overflow-hidden mt-2 w-full border border-[#2d241e]"
      style={{ background: '#1e1611' }}
    >
      <div className="p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Ticket size={12} className="text-green-500 shrink-0" />
            <div className="min-w-0 flex-1 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-200">{coupon.code}</span>
              <span className="text-[9px] font-bold text-green-500">
                {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
              </span>
            </div>
          </div>
          {isApplied ? (
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-[10px] font-bold text-red-400 cursor-pointer hover:underline">Remove</button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onApply(); }} className="px-2.5 py-1 text-[9px] font-black rounded bg-green-600 text-white cursor-pointer active:scale-95 transition-all">Apply</button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Add to Cart Button
const AddToCartBtn = ({ onClick, disabled, isOutOfStock, addingToCart }) => {
  const label = addingToCart ? 'Adding…' : 'ADD TO CART';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl h-11 text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
      style={{
        background: isOutOfStock ? '#261f1a' : '#fff5eb',
        color: isOutOfStock ? '#5c4d43' : '#1a110b',
        border: isOutOfStock ? '1px solid #3d3026' : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <ShoppingBag size={13} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
};

// Quick View Button
const QuickViewBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center rounded-xl h-11 w-11 shrink-0 transition-all active:scale-95 cursor-pointer bg-[#261f1a] border border-[#3d3026]"
  >
    <Eye size={15} className="text-gray-300" />
  </button>
);

const ProductCard = ({ product, layout = 'vertical', cardStyle = 'rounded-xl' }) => {
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

  // SAFE IMAGE VALIDATION
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
    <div className="flex items-center justify-between rounded-xl font-bold h-11 w-full bg-[#261f1a] border border-[#3d3026] text-white" onClick={(e) => e.stopPropagation()}>
      <button onClick={(e) => handleQuantityChange(e, cartQuantity - 1)} className="h-full px-4 flex items-center justify-center cursor-pointer active:bg-[#332922] rounded-l-xl transition-colors">
        <Minus size={12} />
      </button>
      <span className="text-[13px] font-black">{cartQuantity}</span>
      <button onClick={(e) => handleQuantityChange(e, cartQuantity + 1)} className="h-full px-4 flex items-center justify-center cursor-pointer active:bg-[#332922] rounded-r-xl transition-colors">
        <Plus size={12} />
      </button>
    </div>
  );

  if (!product) return null;

  // ─── Horizontal Layout ──────────────────────────────────────────────────
  if (layout === 'horizontal') {
    return (
      <motion.div
        layout onClick={() => navigate(`/product/${product.slug}`)}
        className={`group flex flex-row p-3 gap-3 cursor-pointer transition-all duration-300 w-full ${cardStyleMap[cardStyle]} bg-[#16110e] border border-[#261e19]`}
      >
        <div className="relative w-32 h-32 shrink-0 rounded-xl overflow-hidden bg-[#241b15]">
          {hasValidImage ? <img src={product.image} alt={product.name} className="w-full h-full object-cover object-center" loading="lazy" /> : <ImagePlaceholder />}
          
          {isCakeCategory && (
            <div className="absolute bottom-2 left-2 z-10">
              <ProductBadge type="veg" />
            </div>
          )}

          <button onClick={wish} className="absolute top-2 right-2 p-1.5 rounded-full shadow-md z-10 bg-[#ffffff] hover:bg-gray-100 transition-colors">
            <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} style={{ color: isLiked ? '#ef4444' : '#1a110b' }} />
          </button>
          {product.bestseller && <ProductBadge type="bestseller" absolute />}
        </div>

        <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
          <div className="space-y-1">
            <h3 className="text-[14px] font-semibold leading-snug line-clamp-2 text-gray-100">{product.name}</h3>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-black text-white">₹{Math.round(finalPrice)}</span>
              {(hasOffer || isCouponApplied) && (
                <>
                  <span className="text-[11px] font-medium line-through text-gray-500">₹{isCouponApplied ? displayPrice : mrp}</span>
                  {discountPct > 0 && <span className="text-[11px] font-bold text-orange-400">{discountPct}% OFF</span>}
                </>
              )}
            </div>

            {hasVariants && product.variants.length > 1 && (
              <div className="flex items-center gap-1 flex-wrap py-1" onClick={(e) => e.stopPropagation()}>
                {product.variants.map((v, idx) => (
                  <button key={idx} onClick={() => setSelectedVariantIndex(idx)}
                    className="px-2 py-0.5 rounded text-[9px] font-bold border transition-all"
                    style={{
                      background: selectedVariantIndex === idx ? '#fff5eb' : '#261f1a',
                      color: selectedVariantIndex === idx ? '#1a110b' : '#d1c4ba',
                      borderColor: selectedVariantIndex === idx ? '#fff5eb' : '#3d3026'
                    }}>
                    {v.weight}
                  </button>
                ))}
              </div>
            )}

            {isCouponActive && (
              <div className="flex flex-col gap-1 items-start">
                <button onClick={(e) => { e.stopPropagation(); setShowCoupon(!showCoupon); }} 
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 bg-[#1e2c1e] px-2 py-0.5 rounded-md border border-green-900/50 cursor-pointer">
                  <Ticket size={11} /> {isCouponApplied ? 'Coupon Applied! 🎉' : `Use code: ${coupon.code}`} <ChevronDown size={8} />
                </button>
                <AnimatePresence>
                  {showCoupon && <CouponCard coupon={coupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} isApplied={isCouponApplied} />}
                </AnimatePresence>
              </div>
            )}

            <div className="flex items-center gap-1.5 pt-0.5">
              {rating > 0 ? (
                <>
                  <span className="bg-green-600 text-white px-1.5 py-0.5 rounded-md flex items-center gap-0.5 text-[10px] font-bold">
                    <Star size={10} fill="white" /> {rating.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-gray-400">({reviewCount} Reviews)</span>
                </>
              ) : (
                <span className="text-[11px] text-gray-500">No reviews yet</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
             {cartQuantity > 0 ? <div className="flex-1"><QuantitySelector /></div> : <AddToCartBtn onClick={handleInitialAdd} disabled={isOutOfStock} isOutOfStock={isOutOfStock} addingToCart={addingToCart} />}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Vertical Layout ─────────────────────────────────────────────────────
  return (
    <motion.div
      layout onClick={() => navigate(`/product/${product.slug}`)}
      className={`group h-full flex flex-col transition-all duration-300 overflow-hidden w-full ${cardStyleMap[cardStyle]} bg-[#16110e] border border-[#261e19]`}
    >
      <div className="relative aspect-square overflow-hidden shrink-0 w-full bg-[#241b15]">
        {hasValidImage ? <img src={product.image} alt={product.name} className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500" loading="lazy" /> : <ImagePlaceholder />}
        
        {isCakeCategory && (
          <div className="absolute bottom-2 left-2 z-10">
            <ProductBadge type="veg" />
          </div>
        )}

        <button onClick={wish} className="absolute top-2 right-2 p-2 rounded-full shadow-md z-10 bg-[#ffffff] hover:bg-gray-100 transition-colors">
          <Heart size={15} fill={isLiked ? '#ef4444' : 'none'} style={{ color: isLiked ? '#ef4444' : '#1a110b' }} />
        </button>

        {product.bestseller && <ProductBadge type="bestseller" absolute />}
        {!product.bestseller && product.featured && <ProductBadge type="featured" absolute />}
        {!product.bestseller && !product.featured && product.new && <ProductBadge type="new" absolute />}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-[#16110e]/80 flex items-center justify-center">
            <span className="text-[10px] font-black text-red-400 px-2.5 py-1 rounded-md bg-[#2a1717] border border-red-900 uppercase tracking-widest">Sold Out</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1 text-left">
        <h3 className="text-[14px] font-bold leading-tight text-gray-100 line-clamp-1 mb-1">
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className="text-[16px] font-black text-white">₹{Math.round(finalPrice)}</span>
          {(hasOffer || isCouponApplied) && (
            <>
              <span className="text-[12px] line-through text-gray-500">₹{isCouponApplied ? displayPrice : mrp}</span>
              {discountPct > 0 && <span className="text-[12px] font-bold text-orange-400">{discountPct}% OFF</span>}
            </>
          )}
        </div>

        {hasVariants && product.variants.length > 1 && (
          <div className="flex items-center gap-1 flex-wrap mb-2" onClick={(e) => e.stopPropagation()}>
            {product.variants.map((v, idx) => (
              <button key={idx} onClick={() => setSelectedVariantIndex(idx)}
                className="px-2 py-1 rounded text-[9px] font-black border transition-all cursor-pointer"
                style={{
                  background: selectedVariantIndex === idx ? '#fff5eb' : '#261f1a',
                  color: selectedVariantIndex === idx ? '#1a110b' : '#d1c4ba',
                  borderColor: selectedVariantIndex === idx ? '#fff5eb' : '#3d3026'
                }}>
                {v.weight}
              </button>
            ))}
          </div>
        )}

        {isCouponActive && (
          <div className="mb-2 flex flex-col items-start w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowCoupon(!showCoupon)} className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-[#1e2c1e] px-2 py-0.5 rounded-md border border-green-900/50 cursor-pointer">
              <Ticket size={11} className="shrink-0" />
              <span>{isCouponApplied ? 'Code Applied! 🎉' : `Use code: ${coupon.code}`}</span>
              <ChevronDown size={8} />
            </button>
            <AnimatePresence>
              {showCoupon && <CouponCard coupon={coupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} isApplied={isCouponApplied} />}
            </AnimatePresence>
          </div>
        )}

        <div className="flex items-center gap-1.5 mb-2">
          {rating > 0 ? (
            <>
              <span className="bg-green-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 text-[11px] font-bold">
                <Star size={10} fill="white" /> {rating.toFixed(1)}
              </span>
              {reviewCount > 0 && <span className="text-[11px] text-gray-400 font-medium">({reviewCount} Reviews)</span>}
            </>
          ) : (
            <span className="text-[11px] text-gray-500">No reviews yet</span>
          )}
        </div>

        <div className="flex items-center gap-1 mt-auto pb-3 border-b border-[#261f1a]">
           <MapPin size={12} className="text-gray-500 shrink-0" />
           <span className="text-[11px] text-gray-400 font-medium capitalize">
             Location: <strong className="font-semibold text-gray-200">{product.location || 'Coimbatore'}</strong>
           </span>
        </div>

        <div className="flex items-center gap-2 w-full mt-3">
          <QuickViewBtn onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.slug}`); }} />
          {cartQuantity > 0 ? (
            <div className="flex-1"><QuantitySelector /></div>
          ) : (
            <AddToCartBtn onClick={handleInitialAdd} disabled={isOutOfStock} isOutOfStock={isOutOfStock} addingToCart={addingToCart} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
