import React, { useMemo, useState } from 'react';
import {
  Star, Plus, Minus, Heart, ShoppingCart,
  Tag, Zap, Eye, CheckCircle2, Package,
  ChevronRight, Flame, Copy, Check, MapPin,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateCartQty } from '../redux/slices/cartSlice';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';
import { getCouponUnitDiscount, normalizeCartCoupon } from '../utils/helpers';

/* ─────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────── */

function isProductCouponLive(coupon) {
  if (!coupon?.enabled || !String(coupon.code || '').trim()) return false;
  const now = Date.now();
  if (coupon.startDate && new Date(coupon.startDate).getTime() > now) return false;
  if (coupon.endDate && new Date(coupon.endDate).getTime() < now) return false;
  if (coupon.usageLimit != null && Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)) return false;
  return true;
}

function couponBenefitLabel(coupon) {
  if (!coupon) return '';
  if (coupon.type === 'percent') return `${coupon.value}% OFF`;
  if (coupon.type === 'flat') return `Flat ₹${coupon.value} OFF`;
  if (coupon.type === 'price') return `At ₹${coupon.value}`;
  return 'Extra savings';
}

function getStockStatus(stock) {
  if (stock <= 0) return { label: 'Out of Stock', color: 'error', dot: '#ef4444', urgent: true };
  if (stock <= 5) return { label: `Only ${stock} left`, color: 'warning', dot: '#f59e0b', urgent: true };
  if (stock <= 20) return { label: `${stock} in stock`, color: 'warning', dot: '#f59e0b', urgent: false };
  return { label: `${stock} Available`, color: 'success', dot: '#22c55e', urgent: false };
}

/* ─────────────────────────────────────────────────────
   PRODUCT CARD
───────────────────────────────────────────────────── */

const ProductCard = ({ product, layout = 'vertical' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [addingToCart, setAddingToCart] = useState(false);

  const isLiked = isInWishlist(product._id);
  const isHorizontal = layout === 'horizontal';

  const cartItem = cartItems?.find(
    (item) => item.productId === product._id
  );
  const quantity = cartItem?.qty || 0;

  /* ── BACKEND DATA MAPPING ──────────────────────── */
  const productId = product._id?.$oid || product._id;
  const productName = product.name;
  const productPrice = Number(product.price || 0);
  const productOfferPrice = Number(product.offerPrice || 0);
  const productStock = Number(product.stock ?? 0);
  const productRatings = product.ratingsAverage || 0;
  const productCategory = product.category;
  const productOccasions = product.occasion || [];
  const productLocation = product.location || 'All Stores';

  /* ── STOCK LOGIC ───────────────────────────────── */
  const totalAvailableStock = useMemo(() => {
    if (product.hasVariants && product.variants?.length > 0) {
      return product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }
    return productStock;
  }, [productStock, product.hasVariants, product.variants]);

  const stockStatus = getStockStatus(totalAvailableStock);
  const isOutOfStock = totalAvailableStock <= 0;

  /* ── VARIANT / FLAVOUR info ─────────────────────── */
  const hasVariants = product.hasVariants && product.variants?.length > 0;
  const hasFlavours = product.flavours && product.flavours.length > 0;
  const needsVariantSelection = hasVariants || hasFlavours;

  /* ── PRICE LOGIC ───────────────────────────────── */
  const mrp = productPrice;
  const hasOffer = productOfferPrice > 0 && productOfferPrice < mrp;
  const sellingPrice = hasOffer ? productOfferPrice : mrp;
  const discountPct = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

  /* ── COUPON LOGIC ──────────────────────────────── */
  const couponLive = useMemo(() => isProductCouponLive(product.coupon), [product.coupon]);
  const couponCodeDisplay = couponLive ? String(product.coupon.code).trim().toUpperCase() : '';
  const couponBenefit = couponLive ? couponBenefitLabel(product.coupon) : '';

  const isThisCouponApplied = false; 
  const couponUnitOff = couponLive ? getCouponUnitDiscount(sellingPrice, product.coupon) : 0;
  const priceWithCoupon = Math.max(0, sellingPrice - couponUnitOff);
  const displayPrice = isThisCouponApplied ? priceWithCoupon : sellingPrice;

  /* ── VARIANT starting price (if hasVariants) ─────── */
  const variantStartingPrice = useMemo(() => {
    if (!hasVariants || !product.variants?.length) return null;
    const prices = product.variants.map(v => Number(v.price)).filter(p => p > 0);
    if (!prices.length) return null;
    return Math.min(...prices);
  }, [hasVariants, product.variants]);

  /* ── EVENTS ─────────────────────────────────────── */
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  const add = async (e) => {
    stop(e);
    if (needsVariantSelection) { navigate(`/product/${product.slug}`); return; }
    if (quantity + 1 > totalAvailableStock) { toast.error('Insufficient stock available'); return; }

    setAddingToCart(true);
    let options = {};
    if (hasFlavours && product.flavours[0]) {
      options.flavour = product.flavours[0].name;
      options.weight = product.flavours[0].weightOptions?.[0] || '';
    }
    
    dispatch(addToCart({ product, qty: 1, options }));
    toast.success('Added to cart 🛒');
    setAddingToCart(false);
  };

  const wish = (e) => { stop(e); toggleWishlist(product._id); };

  if (isHorizontal) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative bg-card rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border border-border/40 hover:shadow-2xl transition-all duration-500 flex flex-row w-full bg-white dark:bg-[#1a0f0d] shadow-premium"
      >
        {/* Left: Image Section */}
        <div className="relative w-[35%] xs:w-[40%] sm:w-[35%] shrink-0 overflow-hidden bg-surface border-r border-border/10">
          <Link to={`/product/${product.slug}`} className="block w-full h-full">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
          </Link>
          
          {/* Ratings Badge */}
          <div className="absolute top-2 left-2 sm:top-5 sm:left-5 z-20">
            {product.ratingsAverage > 0 && (
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-4 sm:py-2 bg-white rounded-full shadow-xl">
                <Star size={10} sm:size={14} fill="currentColor" className="text-heading" />
                <span className="text-[10px] sm:text-[12px] font-black text-heading">{product.ratingsAverage.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Location Badge */}
          <div className="absolute bottom-2 left-2 sm:bottom-5 sm:left-5">
            <div className="bg-heading/80 dark:bg-black/60 backdrop-blur-md px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-2xl border border-white/10 flex items-center gap-1 sm:gap-2 shadow-xl">
              <MapPin size={10} sm:size={14} className="text-white" />
              <span className="text-[8px] sm:text-[11px] font-black uppercase tracking-widest text-white truncate max-w-[50px] sm:max-w-none">{productLocation}</span>
            </div>
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-10">
              <span className="bg-white text-primary border border-primary/20 px-4 py-2 rounded-xl text-[9px] sm:text-sm font-black uppercase tracking-widest shadow-2xl">Sold Out</span>
            </div>
          )}
        </div>

        {/* Right: Details Section */}
        <div className="p-3 xs:p-4 sm:p-8 flex flex-col flex-1 min-w-0 relative">
          <button onClick={wish} className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2 sm:p-3 bg-surface dark:bg-white/5 rounded-full shadow-sm hover:scale-110 transition-all border border-border/40">
            <Heart size={16} sm:size={20} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : 'text-primary/60 dark:text-white/60'} />
          </button>

          {/* Category Tags */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <span className="px-2 py-1 sm:px-4 sm:py-1.5 bg-muted/5 dark:bg-white/10 rounded-full border border-border/40 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted">
              {product.category}
            </span>
          </div>

          <Link to={`/product/${product.slug}`}>
            <h3 className="text-sm xs:text-base sm:text-3xl font-black text-heading dark:text-white leading-tight hover:text-primary transition-colors tracking-tight line-clamp-1 sm:line-clamp-2">
              {product.name}
            </h3>
          </Link>

          <p className="hidden xs:block text-[10px] sm:text-base text-muted font-medium line-clamp-1 sm:line-clamp-2 opacity-60 mt-1 sm:mt-2">
            {product.shortDescription}
          </p>

          {/* Price & Add to Cart Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-auto">
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-lg xs:text-xl sm:text-3xl font-black text-heading dark:text-white tracking-tighter">
                  ₹{hasVariants && variantStartingPrice ? variantStartingPrice : displayPrice}
                </span>
                <span className="text-[8px] sm:text-[10px] font-black text-muted/40 uppercase tracking-widest">
                  {hasVariants ? 'Start' : 'Net'}
                </span>
              </div>
              {hasOffer && !hasVariants && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-[10px] sm:text-sm text-muted/40 line-through font-bold">₹{mrp}</span>
                  <span className="text-[9px] sm:text-sm font-black text-primary uppercase">{discountPct}% OFF</span>
                </div>
              )}
            </div>

            <button 
              onClick={add} 
              disabled={isOutOfStock || addingToCart}
              className="h-9 xs:h-11 sm:h-14 px-3 xs:px-6 sm:px-8 bg-[#3D1F1A] text-white rounded-xl sm:rounded-[1.5rem] flex items-center justify-center gap-2 sm:gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/10 disabled:opacity-50"
            >
              {addingToCart ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingCart size={14} className="sm:w-5 sm:h-5" />
                  <span className="text-[8px] xs:text-[10px] sm:text-xs font-black uppercase tracking-widest">{needsVariantSelection ? 'Personalize' : 'Add to Cart'}</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="hidden sm:flex items-center gap-3 mt-4 pt-4 border-t border-border/20">
             <div className="bg-primary/5 dark:bg-white/5 border border-primary/10 px-4 py-2 rounded-2xl flex items-center gap-2 w-fit">
                <div className={`w-2.5 h-2.5 rounded-full ${stockStatus.urgent ? 'animate-pulse' : ''}`} style={{ background: stockStatus.dot }} />
                <span className="text-[11px] font-black uppercase tracking-widest text-primary dark:text-white">
                  {stockStatus.label}
                </span>
             </div>
             
             <Link 
              to={`/product/${product.slug}`}
              className="flex-1 h-12 bg-surface dark:bg-white/5 border border-border/60 rounded-2xl flex items-center justify-center gap-3 group/btn hover:bg-primary hover:border-primary transition-all duration-300"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-heading dark:text-white group-hover/btn:text-button-text">Full Details</span>
              <ChevronRight size={14} className="text-muted group-hover/btn:text-button-text group-hover/btn:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative bg-card rounded-[2.5rem] overflow-hidden transition-all duration-700 flex flex-col h-full bg-white dark:bg-card shadow-premium-sm hover:-translate-y-1.5 cutting-edge-border"
    >
      {/* ─── IMAGE SECTION ─────────────────────── */}
      <div className="relative aspect-[1.1/1] overflow-hidden bg-[#fdf4f2] dark:bg-[#221210] rounded-[2rem] m-2.5 shadow-inner shrink-0">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        </Link>

        {/* Badges Stack - Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
           {product.ratingsAverage > 0 && (
             <div className="flex items-center gap-1 px-2.5 py-1 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full shadow-lg border border-white/20 w-fit">
               <Star size={11} fill="var(--star)" className="text-star" />
               <span className="text-[11px] font-black text-heading dark:text-white">
                 {product.ratingsAverage.toFixed(1)}
               </span>
             </div>
           )}
           {product.bestseller && (
             <div className="bg-primary text-button-text px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1.5 w-fit">
                <Flame size={10} fill="currentColor" />
                <span>Bestseller</span>
             </div>
           )}
        </div>

        {/* Wishlist - Top Right */}
        <button
          onClick={wish}
          className="absolute top-3 right-3 p-2.5 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-20 border border-white/20"
        >
          <Heart
            size={18}
            fill={isLiked ? '#ef4444' : 'none'}
            className={isLiked ? 'text-red-500' : 'text-primary/60 dark:text-white/60'}
          />
        </button>

        {/* Location - Bottom Left */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-heading/90 dark:bg-black/80 backdrop-blur-md rounded-lg border border-white/10 shadow-lg">
            <MapPin size={9} className="text-white" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white">{productLocation}</span>
          </div>
        </div>

        {/* Sold Out Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-10">
            <span className="bg-white text-primary border-2 border-primary/20 px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* ─── DETAILS SECTION ─────────────────────── */}
      <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-1 flex flex-col flex-1 min-h-0">
        <div className="mb-2">
           <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/5 dark:bg-white/5 border border-border/40 rounded-md text-[9px] font-black text-muted uppercase tracking-widest">
              <Zap size={9} fill="currentColor" className="text-primary" />
              {product.occasion?.[0] || product.category}
           </span>
        </div>

        <Link to={`/product/${product.slug}`}>
          <h3 className="text-lg sm:text-[1.35rem] font-black text-heading dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors tracking-tight line-clamp-1">
            {productName}
          </h3>
        </Link>

        {/* Price Section */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <span className="text-xl sm:text-3xl font-black text-heading dark:text-white tracking-tighter">
              ₹{hasVariants && variantStartingPrice ? variantStartingPrice : displayPrice}
            </span>
            <span className="text-[9px] font-black text-muted/60 uppercase tracking-widest">
              {hasVariants ? 'From' : 'Per Unit'}
            </span>
          </div>

          <div className="flex items-center gap-2 h-4">
             {hasOffer && !hasVariants && (
               <>
                 <span className="text-xs text-muted/40 line-through font-bold">₹{mrp}</span>
                 <span className="text-xs font-black text-primary">({discountPct}% OFF)</span>
               </>
             )}
          </div>
        </div>

        {/* Centered Short Description & Info */}
        <div className="flex-1 space-y-3 flex flex-col justify-center min-h-0">
           {product.shortDescription && (
             <p className="text-[10px] text-muted font-bold leading-relaxed line-clamp-1 text-center opacity-70">
               {product.shortDescription}
             </p>
           )}

           {/* Special Deal / Coupon Box */}
           {couponLive && (
              <div className="bg-muted/5 dark:bg-white/5 p-2 sm:p-3 rounded-xl border border-border/30 relative group/deal overflow-hidden shrink-0">
                 <div className="flex items-center justify-between gap-2 sm:gap-3 relative z-10">
                   <div className="min-w-0">
                     <p className="text-[8px] font-black text-muted/60 uppercase tracking-widest mb-0.5">Special Deal</p>
                     <p className="text-[10px] font-black text-heading dark:text-white truncate">
                        Code: <span className="text-primary tracking-widest">{couponCodeDisplay}</span>
                     </p>
                   </div>
                   <button 
                     onClick={add}
                     className="shrink-0 w-8 h-8 bg-primary text-button-text rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                   >
                     <Plus size={14} />
                   </button>
                </div>
             </div>
           )}

           {/* Stock Indicator */}
           <div className="flex items-center gap-1.5 justify-center py-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${stockStatus.urgent ? 'animate-pulse' : ''}`} style={{ background: stockStatus.dot }} />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted/80">
                 {totalAvailableStock} Available
              </span>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-border/40 flex gap-2 sm:gap-3 shrink-0">
           <button 
             onClick={add}
             disabled={isOutOfStock || addingToCart}
             className="flex-[3] flex items-center justify-center gap-2 sm:gap-3 h-12 sm:h-14 bg-primary text-button-text rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 group/add"
           >
             {addingToCart ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <>
                 <ShoppingCart size={18} className="group-hover/add:-translate-y-0.5 transition-transform" />
                 <span>{needsVariantSelection ? 'Personalize' : 'Add to Cart'}</span>
               </>
             )} 
           </button>
           <Link 
             to={`/product/${product.slug}`}
             className="w-12 h-12 border border-border hover:border-primary hover:bg-primary/5 rounded-xl flex items-center justify-center transition-all group/eye shrink-0 hidden xs:flex"
           >
             <Eye size={18} className="text-muted/40 group-hover:text-primary transition-colors" />
           </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;