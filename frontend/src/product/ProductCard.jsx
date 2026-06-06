import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, ShoppingCart, Star, ArrowRight, Tag, MapPin, Eye, CheckCircle2, XCircle, ShoppingBag
} from 'lucide-react';
import EgglessBadge from '../components/ui/EgglessBadge';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';

const ImagePlaceholder = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-card-soft group-hover:bg-muted/5 transition-colors duration-500">
    <div className="w-10 h-10 lg:w-14 lg:h-14 border border-border/30 rounded-full flex items-center justify-center mb-1 lg:mb-2 bg-card shadow-sm">
      <ShoppingBag className="w-4 h-4 lg:w-6 lg:h-6 text-muted group-hover:text-primary transition-colors duration-300" />
    </div>
    <span className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted/70 text-center leading-tight">
      Artisan
    </span>
  </div>
);

const ProductCard = ({ product, layout = 'vertical' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [addingToCart, setAddingToCart] = useState(false);

  const isLiked = isInWishlist(product._id);

  // ─── DERIVED DATA ──────────────────────────────────────────
  const hasVariants = product.hasVariants || (product.variants && product.variants.length > 0);
  const needsVariantSelection = hasVariants && product.variants?.length > 1;

  const hasOffer = !hasVariants && product.offerPrice && product.offerPrice < product.price;
  const displayPrice = hasOffer ? product.offerPrice : product.price;
  const mrp = product.price;
  const discountPct = hasOffer ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  // ─── COUPON DATA ───────────────────────────────────────────
  const coupon = product.coupon;
  const isCouponActive = coupon?.enabled && coupon?.code &&
    (!coupon.endDate || new Date(coupon.endDate) > new Date());

  const couponLabel = isCouponActive
    ? coupon.type === 'percent'
      ? `${coupon.code} · ${coupon.value}% OFF`
      : `${coupon.code} · ₹${coupon.value} OFF`
    : null;

  const totalAvailableStock = useMemo(() => {
    if (hasVariants && product.variants) return product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    return product.stock || 0;
  }, [product, hasVariants]);

  const isOutOfStock = totalAvailableStock <= 0;

  // Rating Data from Backend
  const rating = Number(product.ratingsAverage) || 0;
  const reviewCount = Number(product.ratingsCount) || 0;

  const handleAdd = async (e) => {
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
        options: hasVariants && product.variants ? { flavor: product.variants[0].flavor, weight: product.variants[0].weight } : null,
        variantPrice: hasVariants && product.variants ? product.variants[0].price : null
      }));
      toast.success('Added to bag');
    } catch (err) {
      toast.error('Failed to add');
    } finally {
      setTimeout(() => setAddingToCart(false), 400);
    }
  };

  const wish = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  const productName = product.name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const hasValidImage = product.image && product.image !== 'none' && product.image.trim() !== '';
  const isCakeCategory = String(product.category || '').toLowerCase().includes('cake');

  // Format category to remove hyphens (e.g., "bento-cakes" -> "bento cakes")
  const displayCategory = product.category ? product.category.replace(/-/g, ' ') : 'Artisan Delight';

  // ─── NEUMORPHISM CLASSES ───
  const neumorphismClasses = "bg-card border-none shadow-[5px_5px_15px_rgba(0,0,0,0.3),-5px_-5px_15px_rgba(255,255,255,0.03)] hover:shadow-[inset_5px_5px_15px_rgba(0,0,0,0.3),inset_-5px_-5px_15px_rgba(255,255,255,0.03)] transition-shadow duration-500 rounded-2xl";

  // ─── HORIZONTAL LAYOUT ───
  if (layout === 'horizontal') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate(`/product/${product.slug}`)}
        className={`group flex flex-row p-3 sm:p-4 lg:p-5 gap-3 sm:gap-4 lg:gap-6 cursor-pointer max-w-xl lg:max-w-3xl relative ${neumorphismClasses}`}
      >
        <div className="flex flex-col flex-1 min-w-0 justify-between">
          <div className="space-y-1 lg:space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {isCakeCategory && (
                <div className="shrink-0 w-3.5 h-3.5 lg:w-4 lg:h-4 border border-green-600 flex items-center justify-center rounded-[2px]" title="Pure Veg">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-600 rounded-full"></div>
                </div>
              )}
              {product.bestseller && (
                <span className="px-1.5 py-[2px] lg:px-2 lg:py-1 bg-amber-400/10 text-amber-500 border border-amber-500/20 text-[9px] lg:text-[11px] font-black uppercase rounded tracking-widest">
                  🔥 Best
                </span>
              )}
              {product.featured && (
                <span className="px-1.5 py-[2px] lg:px-2 lg:py-1 bg-primary/10 text-primary border border-primary/20 text-[9px] lg:text-[11px] font-black uppercase rounded tracking-widest">
                  ✨ Featured
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base lg:text-lg font-black text-heading tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
              {productName}
            </h3>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-sm sm:text-base lg:text-xl font-black text-heading">₹{displayPrice}</span>
              {hasOffer && (
                <span className="text-[10px] sm:text-[11px] lg:text-sm font-bold text-muted line-through">₹{mrp}</span>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted font-medium line-clamp-2 leading-relaxed pt-1 pr-2">
                {product.shortDescription}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 mt-2 lg:pt-3 lg:mt-3 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-muted border-t border-border/20">
            <span className="flex items-center gap-1">
              {isOutOfStock ? (
                <><XCircle size={12} className="lg:w-4 lg:h-4 text-red-500" /><span className="text-red-500">Out Of Stock</span></>
              ) : (
                <><CheckCircle2 size={12} className="lg:w-4 lg:h-4 text-emerald-500" /><span className="text-emerald-500">Available</span></>
              )}
            </span>

            {/* Horizontal Rating */}
            <div className="flex items-center gap-1 ml-auto">
              <Star size={12} fill={rating > 0 ? "#eab308" : "none"} className={rating > 0 ? "lg:w-4 lg:h-4 text-yellow-500" : "lg:w-4 lg:h-4 text-muted"} />
              <span className="text-[10px] lg:text-xs font-bold text-heading">{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-40 lg:h-40 shrink-0 rounded-xl overflow-hidden bg-surface self-center shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)]">
          {hasValidImage ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : <ImagePlaceholder />}

          <button onClick={wish} className="absolute top-1 right-1 lg:top-2 lg:right-2 p-1.5 lg:p-2 bg-card/80 backdrop-blur-md rounded-full shadow-sm hover:scale-110 transition-all z-10">
            <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'lg:w-4 lg:h-4 text-red-500' : 'lg:w-4 lg:h-4 text-heading'} />
          </button>

          <div className="absolute bottom-1.5 lg:bottom-2 left-1/2 -translate-x-1/2 w-[85%] z-10">
            <button onClick={handleAdd} disabled={isOutOfStock} className={`w-full py-1 lg:py-1.5 rounded-md text-[9px] lg:text-[11px] font-black tracking-widest uppercase transition-all shadow-md border ${isOutOfStock ? 'bg-card-soft text-muted border-border cursor-not-allowed opacity-80' : 'bg-card text-primary border-primary/30 hover:bg-primary hover:text-button-text'}`}>
              {addingToCart ? '...' : needsVariantSelection ? 'Select' : 'ADD'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── VERTICAL LAYOUT ───
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/product/${product.slug}`)}
      className={`group relative flex flex-col h-full overflow-hidden cursor-pointer ${neumorphismClasses}`}
    >
      {/* 1. IMAGE CONTAINER */}
      <div className="relative w-full aspect-square bg-surface shrink-0 shadow-[inset_0px_-4px_10px_rgba(0,0,0,0.1)]">
        {hasValidImage ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
        ) : <ImagePlaceholder />}

        {/* Top-Left Badges Stacked */}
        <div className="absolute top-2 left-2 lg:top-3 lg:left-3 flex flex-col items-start gap-1 lg:gap-1.5 z-10">
          {product.bestseller && (
            <div className="bg-amber-400 text-amber-950 text-[9px] sm:text-[10px] lg:text-xs font-black px-1.5 py-0.5 lg:px-2 lg:py-1 rounded uppercase tracking-wider shadow-sm">
              Bestseller
            </div>
          )}
          {product.featured && (
            <div className="bg-primary text-button-text text-[9px] sm:text-[10px] lg:text-xs font-black px-1.5 py-0.5 lg:px-2 lg:py-1 rounded uppercase tracking-wider shadow-sm">
              Featured
            </div>
          )}
          {discountPct > 0 && (
            <div className="bg-red-500 text-white text-[9px] sm:text-[10px] lg:text-xs font-black px-1.5 py-0.5 lg:px-2 lg:py-1 rounded uppercase tracking-wider shadow-sm">
              {discountPct}% OFF
            </div>
          )}
        </div>

        {/* Top-Right Wishlist */}
        <button onClick={wish} className="absolute top-2 right-2 lg:top-3 lg:right-3 p-1.5 lg:p-2 bg-card/80 backdrop-blur-md rounded-full shadow-sm hover:scale-110 active:scale-90 transition-all z-10">
          <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} className={`${isLiked ? 'text-red-500' : 'text-muted'} sm:w-4 sm:h-4 lg:w-5 lg:h-5`} />
        </button>
      </div>

      {/* 2. CONTENT CONTAINER */}
      <div className="p-3 lg:p-5 flex flex-col flex-1 gap-1.5 lg:gap-2">

        {/* Category & Minimal Veg Tag */}
        <div className="flex items-start justify-between gap-1">
          <span className="text-[9px] lg:text-[11px] text-muted font-bold uppercase tracking-wider line-clamp-2 leading-tight pr-1">
            {displayCategory}
          </span>
          {isCakeCategory && (
            <div className="shrink-0 w-3.5 h-3.5 lg:w-4 lg:h-4 border border-green-600 flex items-center justify-center rounded-[2px] mt-0.5" title="Pure Veg">
              <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-600 rounded-full"></div>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xs sm:text-sm lg:text-base font-black text-heading line-clamp-2 leading-snug tracking-tight group-hover:text-primary transition-colors">
          {productName}
        </h3>

        {/* Description */}
        {product.shortDescription && (
          <p className="text-[10px] lg:text-xs text-muted font-medium line-clamp-2 leading-snug">
            {product.shortDescription}
          </p>
        )}

        {/* Dynamic Tags & Neumorphic Rating Block */}
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-2 lg:pt-3">
          {/* RATING DISPLAY */}
          <div className="flex items-center gap-1 px-2 py-1 lg:px-2.5 lg:py-1.5 rounded-md bg-surface/50 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1),inset_-1px_-1px_3px_rgba(255,255,255,0.05)]">
            <Star size={12} fill={rating > 0 ? "#eab308" : "none"} className={rating > 0 ? "lg:w-3.5 lg:h-3.5 text-yellow-500" : "lg:w-3.5 lg:h-3.5 text-muted"} />
            <span className="text-[10px] lg:text-xs font-black text-heading">
              {rating.toFixed(1)}
            </span>
            {reviewCount > 0 && (
              <span className="text-[9px] lg:text-[10px] text-muted font-medium ml-0.5">({reviewCount})</span>
            )}
          </div>

          {couponLabel && (
            <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-1 py-[2px] lg:px-1.5 lg:py-1 rounded text-[9px] lg:text-[10px] font-black text-green-500 uppercase">
              <Tag size={8} className="lg:w-3 lg:h-3" /> {coupon.code}
            </div>
          )}
        </div>

        {/* 3. PRICE & ACTIONS */}
        <div className="flex items-end justify-between gap-1 mt-2 pt-2 lg:mt-3 lg:pt-3 border-t border-border/10">
          <div className="flex flex-col">
            {hasOffer && <span className="text-[9px] lg:text-xs line-through text-muted font-bold">₹{mrp}</span>}
            <span className="text-sm lg:text-lg font-black text-heading tracking-tight">₹{displayPrice}</span>
          </div>

          <div className="flex items-center gap-1 lg:gap-2">
            <button onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.slug}`); }} className="p-1.5 lg:p-2.5 rounded-md text-muted hover:text-primary transition-colors bg-card shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.05)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)]">
              <Eye size={14} className="lg:w-4 lg:h-4" />
            </button>
            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`px-2 py-1.5 lg:px-4 lg:py-2.5 rounded-md text-[10px] lg:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 ${isOutOfStock
                ? 'bg-card-soft text-muted cursor-not-allowed opacity-60 shadow-inner'
                : 'bg-primary text-button-text shadow-[3px_3px_8px_rgba(0,0,0,0.2),-2px_-2px_6px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]'
                }`}
            >
              {needsVariantSelection ? 'Select' : addingToCart ? '...' : 'ADD'}
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default ProductCard;