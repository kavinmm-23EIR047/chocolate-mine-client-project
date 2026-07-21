import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Star, ShoppingBag, Plus, Minus, Ticket, MapPin,
  Flame, Sparkles, Percent, Zap, AlertCircle, Scale, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart, updateCartQty } from '../redux/slices/cartSlice';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';
import ImageWithSkeleton from '../components/ui/ImageWithSkeleton';

const BENTO_FLAVOR_PRICES = {
  'White Forest': 380,
  'Butterscotch': 390,
  'Rose Milk': 410,
  'Honey & Almond': 410,
  'Black Forest': 380,
  'Choco Fudge': 390,
  'Choco Truffle': 410,
  'Choco Oreo': 410,
  'Choco Caramel': 420,
  'Death by Chocolate': 450,
  'Red Velvet': 470,
  'Lotus Biscoff': 480,
  'Choco Pistachio': 480,
};

const getFlavorPrice = (flavor) => {
  if (!flavor) return 0;
  if (flavor.price && Number(flavor.price) > 0) return Number(flavor.price);
  if (flavor.name && BENTO_FLAVOR_PRICES[flavor.name]) return BENTO_FLAVOR_PRICES[flavor.name];
  return 0;
};

const ImagePlaceholder = () => (
  <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'var(--card-soft)' }}>
    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <ShoppingBag className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2.5} style={{ color: 'var(--muted)' }} />
    </div>
    <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--muted)' }}>Artisan</span>
  </div>
);

const AnimatedProductBadge = ({ type, value = "" }) => {
  const badgeStyles = {
    veg: {
      className: "inline-flex items-center justify-center shrink-0 p-0.5 md:p-1 rounded border border-green-600 bg-white shadow-sm"
    },
    bestseller: {
      style: { background: 'var(--badge-bestseller-bg)', color: 'var(--badge-bestseller-text)', borderColor: 'var(--badge-bestseller-border)' },
      text: "Best Seller",
      icon: <Flame className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current shrink-0 animate-bounce" strokeWidth={2.5} />
    },
    featured: {
      style: { background: 'var(--badge-featured-bg)', color: 'var(--badge-featured-text)', borderColor: 'var(--badge-featured-border)' },
      text: "Featured",
      icon: <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0 text-amber-400" strokeWidth={2.5} />
    },
    discount: {
      style: { background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(245, 158, 11, 0.9))', color: '#ffffff', borderColor: 'rgba(239, 68, 68, 0.5)' },
      text: `${value}% OFF`,
      icon: <Sparkles strokeWidth={3} className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0 text-amber-200 animate-spin" style={{ animationDuration: '4s' }} />
    },
    new: {
      style: { background: 'var(--badge-new-bg)', color: 'var(--badge-new-text)', borderColor: 'var(--badge-new-border)' },
      text: "New",
      icon: <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current shrink-0" strokeWidth={2.5} />
    }
  };

  if (type === 'veg') {
    return (
      <div className={badgeStyles.veg.className}>
        <div className="w-3.5 h-3.5 md:w-4 md:h-4 border border-green-600 flex items-center justify-center bg-white p-[1px]">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-600 shrink-0" />
        </div>
      </div>
    );
  }

  const badge = badgeStyles[type];
  if (!badge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 2 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.06, y: -1 }}
      className="inline-flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[9px] md:text-[10px] font-black tracking-wider uppercase shadow-md relative overflow-hidden border"
      style={badge.style}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "linear", repeatDelay: 0.8 }}
      />
      <span className="relative z-10 flex items-center gap-1">
        {badge.icon}
        {badge.text}
      </span>
    </motion.div>
  );
};

const LotteryCoupon = ({ coupon }) => {
  if (!coupon) return null;

  const discountVal = coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`;

  return (
    <motion.div
      initial={{ scale: 0.98 }}
      animate={{ scale: [0.98, 1.01, 0.98] }}
      transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
      className="relative mt-1.5 md:mt-2.5 w-full flex items-center justify-between px-1.5 md:px-3 py-1 overflow-hidden rounded-md md:rounded-lg border border-[#D49B35]/70 dark:border-[#E6B25A]/60 bg-gradient-to-r from-[#FFF6E5] via-[#FDE8C5] to-[#FFF6E5] dark:from-[#E6B25A]/15 dark:via-[#F0C46E]/25 dark:to-[#E6B25A]/15 shadow-sm pointer-events-none group min-h-[26px] md:min-h-[32px]"
    >
      {/* Light Shimmer Beam Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 dark:via-white/30 to-transparent -skew-x-12"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ repeat: Infinity, duration: 2.6, ease: 'linear', repeatDelay: 1 }}
      />

      {/* Ticket Cutout Circles */}
      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-[#D49B35]/70 dark:border-[#E6B25A]/50 bg-[var(--card)]" />
      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-[#D49B35]/70 dark:border-[#E6B25A]/50 bg-[var(--card)]" />

      <div className="flex items-center gap-1 pl-1 md:pl-1.5 relative z-10 min-w-0">
        <Sparkles size={11} className="text-[#B37B15] dark:text-[#E6B25A] animate-spin shrink-0 hidden sm:inline-block md:w-3 md:h-3" style={{ animationDuration: '6s' }} />
        <span className="text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-wider text-[#7A4B00] dark:text-[#E6B25A] truncate">
          {coupon.code}
        </span>
      </div>

      <div className="pr-1 md:pr-1.5 flex items-center gap-1 relative z-10 shrink-0">
        <span className="text-[7.5px] sm:text-[8.5px] md:text-[9.5px] font-black uppercase tracking-tight text-white bg-[#9E6500] dark:bg-[#E6B25A]/40 px-1 md:px-1.5 py-0.5 rounded border border-[#7A4B00] dark:border-[#E6B25A]/50 shadow-sm whitespace-nowrap leading-none">
          SAVE {discountVal}
        </span>
      </div>
    </motion.div>
  );
};

// ─── COMPACT CART ACTION BUTTON (WITH GRADIENT BORDER ANIMATION) ─────────────
const SwiggyCartAction = ({ cartQuantity, handleQuantityChange, handleInitialAdd, isOutOfStock, addingToCart, isHome }) => {
  const label = addingToCart ? '...' : 'ADD';

  if (isOutOfStock) {
    return (
      <div
        className="absolute -bottom-3.5 md:-bottom-4 left-1/2 -translate-x-1/2 z-20 border text-[9px] md:text-[10px] font-black px-1.5 py-1 md:px-3 md:py-1.5 rounded-md shadow-md whitespace-nowrap uppercase tracking-wider min-h-[24px] md:min-h-[32px] flex items-center justify-center gap-1"
        style={{ background: 'var(--card-soft)', borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        <AlertCircle size={11} strokeWidth={2.5} className="md:size-[13px]" />
        <span className="hidden md:inline">Sold Out</span>
      </div>
    );
  }

  if (cartQuantity > 0) {
    return (
      <div className="absolute -bottom-3.5 md:-bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-md p-[1px] bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] shadow-lg transition-all">
        <div
          className={`flex items-center justify-between rounded-[5px] ${isHome ? 'h-7 w-[72px]' : 'h-6 w-16'} md:h-9 md:w-[112px] font-bold overflow-hidden`}
          style={{ background: 'var(--button-bg)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => handleQuantityChange(e, cartQuantity - 1)}
            className={`touch-compact h-full min-h-0 ${isHome ? '!min-w-[24px]' : '!min-w-[20px]'} md:!min-w-[34px] px-0.5 md:px-2 flex items-center justify-center transition-colors cursor-pointer`}
            style={{ color: 'var(--button-text)' }}
          >
            <Trash2 size={isHome ? 13 : 11} strokeWidth={2.5} className="md:w-[14px] md:h-[14px]" />
          </button>
          <span className={`${isHome ? 'text-[11px]' : 'text-[10px]'} md:text-[13px] font-black`} style={{ color: 'var(--button-text)' }}>{cartQuantity}</span>
          <button
            onClick={(e) => handleQuantityChange(e, cartQuantity + 1)}
            className={`touch-compact h-full min-h-0 ${isHome ? '!min-w-[24px]' : '!min-w-[20px]'} md:!min-w-[34px] px-0.5 md:px-2 flex items-center justify-center transition-colors cursor-pointer`}
            style={{ color: 'var(--button-text)' }}
          >
            <Plus size={isHome ? 13 : 11} strokeWidth={3.5} className="md:w-[14px] md:h-[14px]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute -bottom-3.5 md:-bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-md p-[1.5px] overflow-hidden shadow-md">
      {/* Moving Linear Gradient Border Backdrop Background */}
      <motion.div
        className="absolute inset-0 w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_center,var(--accent)_0%,var(--secondary)_50%,transparent_100%)]"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        style={{ transformOrigin: 'center' }}
      />
      <button
        onClick={handleInitialAdd}
        className={`touch-compact relative z-10 flex items-center justify-center rounded-[5px] ${isHome ? 'h-7 w-7' : 'h-6 w-6'} md:h-9 md:w-[104px] text-[12px] md:text-[14px] font-extrabold tracking-wider cursor-pointer`}
        style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }}
      >
        <Plus size={isHome ? 14 : 12} strokeWidth={3.5} className="md:w-[15px] md:h-[15px]" />
        <span className="hidden md:inline ml-1">{label}</span>
      </button>
    </div>
  );
};

const ProductCard = ({ product, layout = 'vertical', cardStyle = 'rounded-lg' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isHome = window.location.pathname === '/';

  const [addingToCart, setAddingToCart] = useState(false);

  const isCake = Array.isArray(product?.category) ? product.category.some(c => typeof c === 'string' && c.toLowerCase().includes('cake')) : (product?.category || '').toLowerCase().includes('cake');
  const isBento = (Array.isArray(product?.category) ? product.category.some(c => typeof c === 'string' && c.toLowerCase().includes('bento')) : (product?.category || '').toLowerCase().includes('bento')) || product?.cakeType?.toLowerCase().includes('bento');

  const defaultFlavor = (product?.flavors && Array.isArray(product.flavors) && product.flavors.length > 0)
    ? product.flavors[0]
    : (isBento ? { name: 'White Forest', price: 380 } : null);
  const defaultFlavorName = defaultFlavor ? defaultFlavor.name : 'Standard';
  const defaultFlavorPrice = getFlavorPrice(defaultFlavor);

  const defaultOptions = isCake ? { flavor: defaultFlavorName, weight: isBento ? '250g' : '500g' } : null;

  const hasVariants = product?.hasVariants || (product?.variants && product.variants.length > 0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const activeVariant = hasVariants && product.variants ? product.variants[selectedVariantIndex] : null;

  const cartItems = useSelector((state) => state.cart?.items || []);

  const currentCartItem = cartItems.find(item => {
    const isIdMatch = item.productId === product?._id;
    if (isIdMatch) {
      if (isCake) {
        return JSON.stringify(item.options) === JSON.stringify(defaultOptions);
      }
      if (activeVariant) {
        const activeOptions = { flavor: activeVariant.flavor, weight: activeVariant.weight };
        return JSON.stringify(item.options) === JSON.stringify(activeOptions);
      }
    }
    return isIdMatch;
  });

  const cartQuantity = currentCartItem ? currentCartItem.qty : 0;
  const isLiked = product?._id ? isInWishlist(product._id) : false;

  const cardStyleMap = {
    'rounded-sm': 'rounded-sm',
    'rounded-md': 'rounded-md',
    'rounded-lg': 'rounded-lg',
    'rounded-xl': 'rounded-xl',
  };

  const baseMrp = (activeVariant ? activeVariant.price : Number(product?.price || 0)) + defaultFlavorPrice;
  const baseOfferPrice = (!activeVariant && product?.offerPrice ? Number(product.offerPrice) + defaultFlavorPrice : null);

  const hasOffer = baseOfferPrice && baseOfferPrice < baseMrp;
  const displayPrice = hasOffer ? baseOfferPrice : baseMrp;
  const mrp = baseMrp;
  const discountPct = hasOffer ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  const coupon = product?.coupon;
  const isCouponActive = coupon?.enabled && coupon?.code && (!coupon.endDate || new Date(coupon.endDate) > new Date());

  const finalPrice = displayPrice;

  const isOutOfStock = activeVariant ? activeVariant.stock === false : product?.stock === false;

  const rating = Number(product?.ratingsAverage) || 0;
  const reviewCount = Number(product?.ratingsCount) || 0;
  const isCakeCategory = (Array.isArray(product?.category) ? product.category.some(c => typeof c === 'string' && c.toLowerCase().includes('cake')) : String(product?.category || '').toLowerCase().includes('cake')) || !!product?.cakeType;
  const hasValidImage = typeof product?.image === 'string' && product.image.trim() !== '' && product.image !== 'none';

  const locationDisplay = (product?.location === 'pan-india' || product?.location === 'pan india' || product?.location === 'both')
    ? 'Coimbatore & Pan India'
    : 'Coimbatore Only';

  const handleQuantityChange = (e, newQty) => {
    e.preventDefault(); e.stopPropagation();
    if (newQty < 0) return;

    const targetId = product?._id;
    if (!targetId) return;

    if (newQty === 0) {
      dispatch(removeFromCart(targetId));
      toast.success('Removed from bag');
    } else {
      dispatch(updateCartQty({ productId: targetId, qty: newQty }));
    }
  };

  const handleInitialAdd = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isOutOfStock || !product) return;

    try {
      setAddingToCart(true);
      
      const options = isCake
        ? { flavor: defaultFlavorName, weight: isBento ? '250g' : '500g' }
        : activeVariant
          ? { flavor: activeVariant.flavor, weight: activeVariant.weight }
          : null;
          
      const variantPrice = isCake
        ? Number(product.price || 0) + defaultFlavorPrice
        : activeVariant
          ? activeVariant.price
          : null;

      dispatch(addToCart({
        product: product,
        qty: 1,
        options,
        variantPrice
      }));
      toast.success('Added to bag');
    } catch (err) {
      toast.error('Failed to add');
    } finally {
      setTimeout(() => setAddingToCart(false), 200);
    }
  };

  const wish = (e) => { e.preventDefault(); e.stopPropagation(); if (product?._id) toggleWishlist(product._id); };

  const getDisplayCategory = () => {
    const rawCategories = Array.isArray(product?.category) 
      ? product.category 
      : [product?.category || ''];
      
    const plainStrings = [];
    
    rawCategories.forEach(item => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              parsed.forEach(p => {
                if (typeof p === 'string') plainStrings.push(p);
              });
              return;
            }
          } catch (e) {}
        }
        plainStrings.push(item);
      } else if (item) {
        plainStrings.push(String(item));
      }
    });

    const cleanStrings = plainStrings
      .map(str => str.replace(/\\"/g, '').replace(/"/g, '').trim())
      .filter(Boolean);

    if (cleanStrings.length === 0) return '';
    
    const formattedCats = cleanStrings.map(cat => 
      cat.split(/[\s_-]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    ).join(', ');
    
    if (product?.subCategory && typeof product.subCategory === 'string' && product.subCategory.trim() !== '') {
      let rawSub = product.subCategory.trim();
      if (rawSub.startsWith('[') && rawSub.endsWith(']')) {
        try {
          const parsedSub = JSON.parse(rawSub);
          if (Array.isArray(parsedSub) && parsedSub.length > 0) {
            rawSub = parsedSub[0];
          }
        } catch {}
      }
      const cleanSub = rawSub.replace(/\\"/g, '').replace(/"/g, '').trim();
      if (cleanSub) {
        const formattedSub = cleanSub.split(/[\s_-]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        return `${formattedCats} (${formattedSub})`;
      }
    }
    
    return formattedCats;
  };

  if (!product) return null;

  // ─── Horizontal Layout ─────────────────────
  if (layout === 'horizontal') {
    return (
      <motion.div
        layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate(`/product/${product.slug}`)}
        className="flex flex-row p-3 sm:p-4 pb-8 gap-3 sm:gap-4 items-stretch cursor-pointer w-full border-b transition-colors min-w-0"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col flex-1 min-w-0 justify-between overflow-hidden">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {isCakeCategory && <AnimatedProductBadge type="veg" />}
              {product.bestseller && <AnimatedProductBadge type="bestseller" />}
              {!product.bestseller && product.featured && <AnimatedProductBadge type="featured" />}
              {discountPct > 0 && <AnimatedProductBadge type="discount" value={discountPct} />}
            </div>

            {getDisplayCategory() && (
              <span className="text-[11px] md:text-xs font-extrabold text-[#B59C94] uppercase tracking-wider mb-1 block">
                {getDisplayCategory()}
              </span>
            )}
            <h3 className="text-[14px] sm:text-[15px] font-bold leading-tight break-words" style={{ color: 'var(--heading)' }}>
              {product.name}
            </h3>

            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[14px] sm:text-[16px] font-black" style={{ color: 'var(--heading)' }}>₹{Math.round(finalPrice)}</span>
              {hasOffer && (
                <>
                  <span className="text-[10px] sm:text-[11px] line-through" style={{ color: 'var(--muted)' }}>₹{mrp}</span>
                  <span className="text-[9px] sm:text-[10px] font-black text-white bg-emerald-800 dark:bg-emerald-900 border border-emerald-900 dark:border-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm animate-pulse">
                    <Sparkles size={10} className="text-amber-300" />
                    {discountPct}% OFF
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-0.5 mt-1 text-[11px] font-bold text-green-500">
              <Star size={12} fill={rating > 0 ? "currentColor" : "none"} strokeWidth={2.5} />
              <span>{rating > 0 ? rating.toFixed(1) : '0'}</span>
              <span className="font-medium text-[10px] ml-1" style={{ color: 'var(--muted)' }}>
                ({reviewCount === 1 ? '1 review' : `${reviewCount} reviews`})
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2 pr-2">
            {hasVariants && product.variants.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                <Scale size={13} strokeWidth={2.5} style={{ color: 'var(--muted)' }} />
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
              <div className="w-full max-w-[180px]">
                <LotteryCoupon coupon={coupon} />
              </div>
            )}

            <div className="flex items-center gap-1 text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
              <MapPin size={11} strokeWidth={2.5} />
              <span className="capitalize break-all">{locationDisplay}</span>
            </div>
          </div>
        </div>

        <div className="relative shrink-0 w-[104px] sm:w-28 md:w-36 aspect-square rounded-xl self-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="w-full h-full overflow-hidden rounded-xl">
            {hasValidImage ? (
              <ImageWithSkeleton
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
                fallback={<ImagePlaceholder />}
              />
            ) : <ImagePlaceholder />}
          </div>

          <button
            onClick={wish}
            className={`touch-compact absolute top-1.5 right-1.5 flex items-center justify-center rounded-full shadow-md z-10 ${isHome ? '!w-7 !h-7' : '!w-5 !h-5'} !min-w-0 !min-h-0 md:!w-9 md:!h-9 border`}
            style={{
              background: 'var(--card)',
              borderColor: 'var(--border)',
              boxShadow: '0 2px 8px rgba(var(--shadow-color), 0.08)'
            }}
          >
            <Heart
              className={`${isHome ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} md:w-[16px] md:h-[16px]`}
              fill={isLiked ? '#ef4444' : 'none'}
              strokeWidth={2.5}
              style={{ color: isLiked ? '#ef4444' : 'var(--heading)' }}
            />
          </button>

          <SwiggyCartAction
            cartQuantity={cartQuantity}
            handleQuantityChange={handleQuantityChange}
            handleInitialAdd={handleInitialAdd}
            isOutOfStock={isOutOfStock}
            addingToCart={addingToCart}
            isHome={isHome}
          />
        </div>
      </motion.div>
    );
  }

  // ─── Vertical Layout ───────────────────────────────
  return (
    <motion.div
      layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate(`/product/${product.slug}`)}
      className={`group w-full h-full min-w-0 flex flex-col justify-between cursor-pointer transition-all duration-200 p-3 sm:p-4 pb-8 ${cardStyleMap[cardStyle]}`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div>
        <div className="relative aspect-square overflow-visible shrink-0 w-full mb-8" style={{ background: 'var(--surface)', borderRadius: '12px' }}>
          <div className="w-full h-full overflow-hidden rounded-xl">
            {hasValidImage ? (
              <ImageWithSkeleton
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                fallback={<ImagePlaceholder />}
              />
            ) : <ImagePlaceholder />}
          </div>

          <button
            onClick={wish}
            className={`touch-compact absolute top-1.5 right-1.5 flex items-center justify-center rounded-full shadow-md z-10 ${isHome ? '!w-8 !h-8' : '!w-6 !h-6'} !min-w-0 !min-h-0 md:!w-9 md:!h-9 border`}
            style={{
              background: 'var(--card)',
              borderColor: 'var(--border)',
              boxShadow: '0 2px 8px rgba(var(--shadow-color), 0.08)'
            }}
          >
            <Heart
              className={`${isHome ? 'w-4 h-4' : 'w-3 h-3'} md:w-[16px] md:h-[16px]`}
              fill={isLiked ? '#ef4444' : 'none'}
              strokeWidth={2.5}
              style={{ color: isLiked ? '#ef4444' : 'var(--heading)' }}
            />
          </button>

          <SwiggyCartAction
            cartQuantity={cartQuantity}
            handleQuantityChange={handleQuantityChange}
            handleInitialAdd={handleInitialAdd}
            isOutOfStock={isOutOfStock}
            addingToCart={addingToCart}
            isHome={isHome}
          />
        </div>

        <div className="flex flex-col text-left mt-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {isCakeCategory && <AnimatedProductBadge type="veg" />}
            {product.bestseller && <AnimatedProductBadge type="bestseller" />}
            {!product.bestseller && product.featured && <AnimatedProductBadge type="featured" />}
            {discountPct > 0 && <AnimatedProductBadge type="discount" value={discountPct} />}
          </div>

          {getDisplayCategory() && (
            <span className="text-[11px] md:text-xs font-extrabold text-[#B59C94] uppercase tracking-wider mb-1 block">
              {getDisplayCategory()}
            </span>
          )}
          <h3 className="text-[14px] md:text-[15px] font-bold leading-tight mb-1 break-words" style={{ color: 'var(--heading)' }}>
            {product.name}
          </h3>

          <div className="flex items-center gap-1 text-[12px] font-medium mb-1 flex-wrap" style={{ color: 'var(--muted)' }}>
            <div className="flex items-center gap-0.5 font-bold text-green-500">
              <Star size={13} fill={rating > 0 ? "currentColor" : "none"} strokeWidth={2.5} />
              <span>{rating > 0 ? rating.toFixed(1) : '0'}</span>
              <span className="font-normal text-[11px] ml-0.5" style={{ color: 'var(--muted)' }}>
                ({reviewCount === 1 ? '1 review' : `${reviewCount} reviews`})
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-0.5">
              <MapPin size={11} strokeWidth={2.5} />
              <span className="capitalize break-all">{locationDisplay}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col text-left mt-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[15px] md:text-[17px] font-black" style={{ color: 'var(--heading)' }}>₹{Math.round(finalPrice)}</span>
          {hasOffer && (
            <>
              <span className="text-[11px] md:text-[12px] line-through" style={{ color: 'var(--muted)' }}>₹{mrp}</span>
              <span className="text-[9px] md:text-[10px] font-black text-white bg-emerald-800 dark:bg-emerald-900 border border-emerald-900 dark:border-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm animate-pulse">
                <Sparkles size={10} className="text-amber-300" />
                {discountPct}% OFF
              </span>
            </>
          )}
        </div>

        {hasVariants && product.variants.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-2" onClick={(e) => e.stopPropagation()}>
            <Scale size={13} strokeWidth={2.5} style={{ color: 'var(--muted)' }} />
            {product.variants.map((v, idx) => (
              <button key={idx} onClick={() => setSelectedVariantIndex(idx)}
                className="px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-black border transition-all cursor-pointer"
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
          <LotteryCoupon coupon={coupon} />
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;