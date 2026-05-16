import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, ShoppingCart, Star, Clock,
  ArrowRight, Flame, Tag, Check, Info, ShoppingBag,
  Eye, MapPin
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';

/**
 * Premium ProductCard - Unifies high-contrast artisan aesthetic with rich backend data.
 * Supports 'vertical' (grid) and 'horizontal' (list) modes.
 */
const ProductCard = ({ product, layout = 'vertical' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: userInfo } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [addingToCart, setAddingToCart] = useState(false);
  const isLiked = isInWishlist(product._id);

  // ─── DERIVED DATA ──────────────────────────────────────────
  const hasVariants = product.hasVariants || (product.variants && product.variants.length > 0);
  const needsVariantSelection = hasVariants && product.variants?.length > 1;

  const displayPrice = product.offerPrice || product.price;
  const mrp = product.price;
  const hasOffer = product.offerPrice && product.offerPrice < product.price;
  const discountPct = hasOffer ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  // ─── COUPON DATA ───────────────────────────────────────────
  const coupon = product.coupon;
  const isCouponActive = coupon?.enabled && coupon?.code &&
    (!coupon.endDate || new Date(coupon.endDate) > new Date());
  const couponLabel = isCouponActive
    ? coupon.type === 'percent'
      ? `${coupon.code} · ${coupon.value}% OFF`
      : coupon.type === 'flat' || coupon.type === 'price'
      ? `${coupon.code} · ₹${coupon.value} OFF`
      : coupon.code
    : null;

  const totalAvailableStock = useMemo(() => {
    if (hasVariants && product.variants) return product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    return product.stock || 0;
  }, [product, hasVariants]);

  const isOutOfStock = totalAvailableStock <= 0;
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
        _id: product._id,
        name: product.name,
        image: product.image,
        price: displayPrice,
        variantId: hasVariants && product.variants ? product.variants[0]._id : null,
        variantName: hasVariants && product.variants ? product.variants[0].name : null,
        quantity: 1,
        stock: totalAvailableStock
      }));
      toast.success('Added to bag');
    } catch (err) {
      toast.error('Failed to add');
    } finally {
      setTimeout(() => setAddingToCart(false), 500);
    }
  };

  const wish = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  const productName = product.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  // ─── HORIZONTAL LAYOUT (Swiggy-style) ──────────────────────────
  if (layout === 'horizontal') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate(`/product/${product.slug}`)}
        className="group flex flex-row bg-card border border-border/30 rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer max-w-xl"
      >
        {/* LEFT — Square Image (fixed 130px) */}
        <div className="relative w-[130px] sm:w-[160px] shrink-0 overflow-hidden bg-surface">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ aspectRatio: '1/1' }}
            loading="lazy"
          />
          {/* Rating pill on image */}
          {rating > 0 && (
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-green-600 text-white rounded-md text-[9px] font-black shadow">
              {rating.toFixed(1)} <Star size={8} fill="currentColor" />
            </div>
          )}
          {/* Sold out overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
              <span className="text-[8px] font-black uppercase tracking-widest text-white bg-black/50 px-2 py-1 rounded-lg">Sold Out</span>
            </div>
          )}
          {/* Wishlist */}
          <button
            onClick={wish}
            className="absolute top-1.5 right-1.5 p-1 bg-card/80 backdrop-blur-sm rounded-full shadow hover:scale-110 transition-all z-20"
            aria-label="Add to wishlist"
          >
            <Heart size={12} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : 'text-heading/40'} />
          </button>
        </div>

        {/* RIGHT — Content */}
        <div className="flex flex-col flex-1 min-w-0 p-3 sm:p-4 gap-1 justify-between">

          {/* Top section */}
          <div className="flex flex-col gap-1">
            {/* Badges */}
            {(product.bestseller || discountPct > 0 || couponLabel) && (
              <div className="flex flex-wrap items-center gap-1">
                {product.bestseller && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-warning-light border border-warning-text/20 text-warning-text text-[7px] font-black uppercase tracking-widest rounded-md shadow-sm">
                    🔥 Best
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="px-1.5 py-0.5 bg-error-light border border-error-text/20 text-error-text text-[7px] font-black uppercase tracking-widest rounded-md shadow-sm">
                    -{discountPct}%
                  </span>
                )}
                {couponLabel && (
                  <span
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(coupon.code); }}
                    title="Click to copy"
                    className="flex items-center gap-0.5 px-1.5 py-0.5 bg-success-light border border-success-text/20 text-success-text text-[7px] font-black uppercase tracking-wide rounded-md cursor-pointer hover:bg-success-light/80 transition-colors shadow-sm"
                  >
                    <Tag size={7} /> {couponLabel}
                  </span>
                )}
              </div>
            )}

            {/* Category */}
            <span className="text-[8px] font-black uppercase tracking-[0.18em] text-primary capitalize">
              {product.category}
            </span>

            {/* Name */}
            <h3 className="text-[13px] sm:text-[15px] font-black text-heading leading-snug line-clamp-2 uppercase italic tracking-tight group-hover:text-primary transition-colors">
              {productName}
            </h3>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-[10px] text-heading/70 line-clamp-1 italic leading-tight">
                {product.shortDescription}
              </p>
            )}

            {/* Stock & Location */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${totalAvailableStock < 10 ? 'animate-pulse bg-orange-500' : 'bg-green-500'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-heading/80">{totalAvailableStock} Left</span>
              {product.location && (
                <>
                  <span className="text-heading/20">·</span>
                  <MapPin size={9} className="text-primary shrink-0" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-heading/80 capitalize">{product.location}</span>
                </>
              )}
            </div>

            {/* Occasions */}
            {product.occasion?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.occasion.slice(0, 2).map((occ) => (
                  <span key={occ} className="text-[7px] font-black uppercase tracking-wide text-heading/70 bg-heading/5 border border-heading/10 px-1 py-0.5 rounded capitalize">
                    {occ}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom — Price + Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-heading/10 mt-1">
            <div className="flex flex-col">
              <span className="text-[15px] sm:text-lg font-black text-heading leading-none">₹{displayPrice}</span>
              {hasOffer && (
                <span className="text-[9px] font-bold text-heading/40 line-through">₹{mrp}</span>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.slug}`); }}
                className="p-2 bg-heading/5 text-heading hover:bg-heading/10 rounded-xl transition-all"
                aria-label="View"
              >
                <Eye size={14} />
              </button>
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-button-text rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
              >
                {needsVariantSelection ? <ArrowRight size={13} /> : <ShoppingCart size={13} />}
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── VERTICAL LAYOUT (GRID VIEW) ───────────────────────────
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/product/${product.slug}`)}
      className="group relative flex flex-col h-full bg-card border border-border/30 rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 cursor-pointer"
    >
      {/* Image Area */}
      <div className="relative aspect-[1/1] sm:aspect-[1.5/1] overflow-hidden bg-surface">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        {/* Badges on image — removed, now in content area */}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/90 bg-black/50 px-3 py-1.5 rounded-lg">Sold Out</span>
          </div>
        )}
        <button onClick={wish} className="absolute top-2 right-2 p-2 bg-card/80 backdrop-blur-sm rounded-full shadow hover:scale-110 active:scale-90 transition-all z-20">
          <Heart size={16} fill={isLiked ? '#ef4444' : 'none'} className={isLiked ? 'text-red-500' : 'text-heading/40'} />
        </button>
        {rating > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white rounded-md text-[9px] font-black shadow-lg">
            {rating.toFixed(1)} <Star size={10} fill="currentColor" />
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-3 sm:p-6 gap-2 sm:gap-4 justify-between">
        <div>
          {/* Badges row in content area — visible on ALL screens */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
            {product.bestseller && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-warning-light border border-warning-text/20 text-warning-text text-[7px] sm:text-[10px] font-black uppercase tracking-widest rounded-md sm:rounded-lg shadow-sm">
                🔥 Bestseller
              </span>
            )}
            {discountPct > 0 && (
              <span className="px-1.5 py-0.5 bg-error-light border border-error-text/20 text-error-text text-[7px] sm:text-[10px] font-black uppercase tracking-widest rounded-md sm:rounded-lg shadow-sm">
                -{discountPct}% OFF
              </span>
            )}
            {couponLabel && (
              <span
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(coupon.code); }}
                title="Click to copy coupon code"
                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-success-light border border-success-text/20 text-success-text text-[7px] sm:text-[10px] font-black uppercase tracking-wide rounded-md sm:rounded-lg cursor-pointer hover:bg-success-light/80 transition-colors shadow-sm"
              >
                <Tag size={8} /> {couponLabel}
              </span>
            )}
          </div>
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.18em] text-primary block mb-1 capitalize">{product.category}</span>
          <h3 className="text-[12px] sm:text-[17px] font-black text-heading leading-tight uppercase italic tracking-tight line-clamp-2 group-hover:text-primary transition-colors">{productName}</h3>

          {product.shortDescription && (
            <p className="text-[9px] sm:text-[13px] text-heading/85 line-clamp-2 mt-2 leading-relaxed italic">
              {product.shortDescription}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 sm:mt-4">
            <div className={`w-1.5 h-1.5 rounded-full ${totalAvailableStock < 10 ? 'animate-pulse bg-orange-500' : 'bg-green-500'}`} />
            <span className="text-[8px] sm:text-[13px] font-black uppercase tracking-widest text-heading/80">{totalAvailableStock} Left</span>
            {product.location && (
              <>
                <span className="text-heading/30">|</span>
                <div className="flex items-center gap-1 text-heading/80">
                  <MapPin size={10} className="text-primary sm:w-4 sm:h-4" />
                  <span className="text-[8px] sm:text-[13px] font-black uppercase tracking-widest capitalize">{product.location}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-heading/20">
          <div className="flex flex-col">
            <span className="text-[16px] sm:text-xl font-black text-heading leading-none">₹{displayPrice}</span>
            {hasOffer && <span className="text-[9px] sm:text-[11px] font-bold text-heading/40 line-through">₹{mrp}</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.slug}`); }} className="p-2.5 sm:p-3 bg-heading/5 text-heading hover:bg-heading/10 rounded-xl transition-all" title="View Details"><Eye size={18} /></button>
            <button onClick={handleAdd} disabled={isOutOfStock} className="p-2.5 sm:p-3 bg-primary text-button-text rounded-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center">
              {needsVariantSelection ? <ArrowRight size={18} /> : <ShoppingCart size={18} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;