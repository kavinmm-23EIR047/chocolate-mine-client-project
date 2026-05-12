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
        className="group relative bg-card rounded-[2.5rem] overflow-hidden border border-border/40 hover:shadow-2xl transition-all duration-500 flex flex-col md:flex-row w-full bg-white dark:bg-[#1a0f0d] shadow-premium"
      >
        {/* Left: Image Box */}
        <div className="relative w-full md:w-[40%] lg:w-[35%] shrink-0 aspect-[4/3] md:aspect-auto overflow-hidden bg-background dark:bg-[#221210] m-4 rounded-[2rem]">
          <Link to={`/product/${product.slug}`} className="block w-full h-full">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          </Link>
          <div className="absolute top-5 left-5 z-20">
            {product.ratingsAverage > 0 && (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full shadow-lg border border-white/20">
                <Star size={14} fill="#3D1F1A" className="text-[#3D1F1A] dark:text-white" />
                <span className="text-[12px] font-black text-primary dark:text-white">{product.ratingsAverage.toFixed(1)}</span>
              </div>
            )}
          </div>
          <button onClick={wish} className="absolute top-5 right-5 z-20 p-3 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full shadow-lg hover:scale-110 transition-all border border-white/20">
            <Heart size={20} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : 'text-primary/60 dark:text-white/60'} />
          </button>
          
          <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
             <div className="bg-primary/90 dark:bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-xl">
               <div className="flex items-center gap-2">
                 <MapPin size={12} className="text-white" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white">{productLocation}</span>
               </div>
             </div>
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-10">
              <span className="bg-white text-primary border-2 border-primary/20 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl">Sold Out</span>
            </div>
          )}
        </div>

        {/* Right: Content Box */}
        <div className="p-8 md:p-10 flex flex-col flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-6">
             <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary dark:text-white bg-primary/5 dark:bg-white/10 px-4 py-1.5 rounded-full border border-primary/20">
               {product.category}
             </span>
             {product.occasion?.map((occ, idx) => idx < 2 && (
               <span key={occ} className="text-[10px] font-black text-primary/60 dark:text-white/60 uppercase tracking-widest bg-primary/5 dark:bg-white/5 px-3 py-1.5 rounded-lg">
                 {occ}
               </span>
             ))}
          </div>

          <Link to={`/product/${product.slug}`}>
            <h3 className="text-3xl md:text-5xl font-black text-heading dark:text-white leading-[1] mb-6 hover:text-primary transition-colors tracking-tighter">
              {product.name}
            </h3>
          </Link>

          <p className="text-lg text-muted font-medium line-clamp-3 leading-relaxed mb-10">
            {product.shortDescription || product.description?.substring(0, 200)}
          </p>

          <div className="flex flex-wrap items-end gap-12 mt-auto">
            {/* Price Block */}
            <div className="space-y-2">
               <div className="flex items-baseline gap-3">
                 <span className="text-4xl font-black text-heading dark:text-white tracking-tighter">
                   ₹{hasVariants && variantStartingPrice ? variantStartingPrice : displayPrice}
                 </span>
                 <span className="text-[11px] font-black text-muted uppercase tracking-[0.2em]">
                   {hasVariants ? 'From' : 'Net Price'}
                 </span>
               </div>
               <div className="flex items-center gap-4 h-6">
                 {hasOffer && !hasVariants && (
                   <>
                     <span className="text-lg text-muted/60 line-through">₹{mrp}</span>
                     <span className="text-base font-black text-primary dark:text-white">{discountPct}% OFF</span>
                   </>
                 )}
               </div>
            </div>

            {/* Action Block */}
            <div className="flex-1 min-w-[280px] flex items-center gap-4">
               {couponLive ? (
                 <div className="flex-1 bg-primary/5 dark:bg-white/5 border border-dashed border-primary/30 dark:border-white/20 p-5 rounded-3xl flex items-center justify-between gap-6 hover:bg-primary/10 transition-all">
                    <div className="min-w-0">
                       <p className="text-[10px] font-black text-primary dark:text-white uppercase tracking-[0.2em] mb-1">Coupon Available</p>
                       <p className="text-sm font-bold text-heading dark:text-white truncate">Code: <span className="text-primary font-black tracking-widest uppercase">{couponCodeDisplay}</span></p>
                    </div>
                    <button onClick={add} className="shrink-0 h-12 px-8 bg-primary text-button-text rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20">Claim</button>
                 </div>
               ) : (
                 <button onClick={add} disabled={isOutOfStock || addingToCart} className="flex-1 h-16 bg-primary text-button-text rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] hover:shadow-2xl shadow-xl shadow-primary/10 transition-all disabled:opacity-50 flex items-center justify-center gap-4">
                   {addingToCart ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShoppingCart size={20} />}
                   {needsVariantSelection ? 'Personalize' : 'Add to Cart'}
                 </button>
               )}
            </div>
          </div>
          
          <div className="mt-10 pt-8 border-t border-border/30 flex flex-wrap items-center justify-between gap-6">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 dark:bg-white/5 rounded-xl border border-primary/10">
                   <div className={`w-2.5 h-2.5 rounded-full ${stockStatus.urgent ? 'animate-pulse' : ''}`} style={{ background: stockStatus.dot }} />
                   <span className="text-[11px] font-black uppercase tracking-[0.15em] text-primary dark:text-white">{stockStatus.label}</span>
                </div>
             </div>
             <Link 
               to={`/product/${product.slug}`} 
               className="group/details h-12 px-8 rounded-2xl bg-primary/5 hover:bg-primary border border-primary/20 hover:border-primary text-[11px] font-black uppercase tracking-widest text-primary hover:text-button-text transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-xl hover:shadow-primary/20"
             >
               <span>View Full Details</span>
               <ChevronRight size={14} strokeWidth={3} className="group-hover/details:translate-x-1 transition-transform" />
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
      <div className="px-5 pb-5 pt-1 flex flex-col flex-1 min-h-0">
        <div className="mb-2">
           <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/5 dark:bg-white/5 border border-border/40 rounded-md text-[9px] font-black text-muted uppercase tracking-widest">
              <Zap size={9} fill="currentColor" className="text-primary" />
              {product.occasion?.[0] || product.category}
           </span>
        </div>

        <Link to={`/product/${product.slug}`}>
          <h3 className="text-xl sm:text-[1.35rem] font-black text-heading dark:text-white leading-tight mb-2.5 group-hover:text-primary transition-colors tracking-tight line-clamp-1">
            {productName}
          </h3>
        </Link>

        {/* Price Section */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <span className="text-2xl sm:text-3xl font-black text-heading dark:text-white tracking-tighter">
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
             <div className="bg-muted/5 dark:bg-white/5 p-3 rounded-xl border border-border/30 relative group/deal overflow-hidden shrink-0">
                <div className="flex items-center justify-between gap-3 relative z-10">
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
        <div className="pt-4 mt-4 border-t border-border/40 flex gap-3 shrink-0">
           <button 
             onClick={add}
             disabled={isOutOfStock || addingToCart}
             className="flex-[3] flex items-center justify-center gap-3 h-14 bg-primary text-button-text rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 group/add"
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
             className="w-12 h-12 border border-border hover:border-primary hover:bg-primary/5 rounded-xl flex items-center justify-center transition-all group/eye shrink-0"
           >
             <Eye size={18} className="text-muted/40 group-hover:text-primary transition-colors" />
           </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;