import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  ShoppingCart,
  Heart,
  Clock,
  ArrowRight,
  Minus,
  Plus,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Tag,
  Truck,
  RotateCcw,
  ShieldCheck,
  Share2,
  Percent,
  Info,
  Cake,
  Scale,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import productService from '../services/productService';
import reviewService from '../services/reviewService';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateCartQty, setCoupon } from '../redux/slices/cartSlice';
import { useGetProductBySlugQuery } from '../services/api/productApi';
import { useGetProductReviewsQuery } from '../services/api/reviewApi';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { formatCurrency, getCouponUnitDiscount, idsMatch } from '../utils/helpers';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: productRes, isLoading: loading } = useGetProductBySlugQuery(slug);
  const product = productRes?.data;
  
  const productId = product?._id?.$oid || product?._id;
  const { data: reviewRes } = useGetProductReviewsQuery(productId, { skip: !productId });
  const productReviews = reviewRes?.data?.reviews || [];

  const { user } = useAuth();
  const cartItems = useSelector((state) => state.cart.items);
  const appliedCoupon = useSelector((state) => state.cart.appliedCoupon);
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('description');
  const [imgZoom, setImgZoom] = useState(false);
  const [displayImage, setDisplayImage] = useState(null);
  const quantity = 1; // Fixed quantity for product details page
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Cake-specific states for variant system
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [customFlavor, setCustomFlavor] = useState('');
  const [customWeight, setCustomWeight] = useState('');
  const [showCustomFlavorInput, setShowCustomFlavorInput] = useState(false);
  const [showCustomWeightInput, setShowCustomWeightInput] = useState(false);

  // ─── INITIALIZE SELECTIONS ─────────────────────────────
  useEffect(() => {
    if (product) {
      // Initialize cake selections if product has variants
      if (product.category === 'cakes' && product.hasVariants && product.variants && product.variants.length > 0) {
        const initialVariant = product.variants.find(v => v.stock > 0) || product.variants[0];
        
        if (initialVariant) {
          const initialFlavor = product.flavors?.find(f => f.name === initialVariant.flavor) || { name: initialVariant.flavor };
          setSelectedFlavor(initialFlavor);
          setSelectedWeight(initialVariant.weight);
          setSelectedPrice(initialVariant.price);
          setSelectedStock(initialVariant.stock);
          
          if (initialFlavor.images && initialFlavor.images.length > 0) {
            setDisplayImage(initialFlavor.images[0]);
          } else {
            setDisplayImage(product.image || null);
          }
        } else {
          setDisplayImage(product.image || null);
        }
      } else {
        setDisplayImage(product.image || null);
        setSelectedStock(product.stock);
      }

      // Related products (we'll keep it simple for now or use another RTK Query)
    }
  }, [product]);

  // Handle quantity change - removed as per requirements

  // Handle flavor change
  const handleFlavorChange = (flavor) => {
    setSelectedFlavor(flavor);
    setShowCustomFlavorInput(false);
    setCustomFlavor('');


    let variant = product.variants?.find(v => v.flavor === flavor.name && v.weight === selectedWeight);
    if (!variant && product.variants) {
      variant = product.variants.find(v => v.flavor === flavor.name);
    }

    if (variant) {
      setSelectedWeight(variant.weight);
      setSelectedPrice(variant.price);
      setSelectedStock(variant.stock);
    }

    if (flavor.images && flavor.images.length > 0) {
      setDisplayImage(flavor.images[0]);
    }
  };

  // Handle weight change
  const handleWeightChange = (weight) => {
    setSelectedWeight(weight);
    setShowCustomWeightInput(false);
    setCustomWeight('');


    const variant = product.variants?.find(v => v.flavor === selectedFlavor?.name && v.weight === weight);
    if (variant) {
      setSelectedPrice(variant.price);
      setSelectedStock(variant.stock);
    }
  };

  // Handle custom flavor input
  const handleCustomFlavorSubmit = () => {
    if (customFlavor.trim()) {
      setSelectedFlavor({ name: customFlavor.trim(), images: [] });
      setShowCustomFlavorInput(false);
      setSelectedPrice(product.variants?.[0]?.price || product.price);
    }
  };

  // Handle custom weight input
  const handleCustomWeightSubmit = () => {
    if (customWeight.trim()) {
      setSelectedWeight(customWeight.trim());
      setShowCustomWeightInput(false);
    }
  };

  // ─── BACKEND DATA MAPPING ─────────────────────────────
  const productName = product?.name;
  const productDescription = product?.description;
  const productPrice = Number(product?.price || 0);
  const productOfferPrice = Number(product?.offerPrice || 0);
  const productStock = Number(product?.stock ?? 0);
  const productCategory = product?.category;
  const productOccasions = product?.occasion || [];

  // ─── CART / WISHLIST STATE ──────────────────────────────
  const currentVariantFlavor = productCategory === 'cakes'
    ? (showCustomFlavorInput ? customFlavor : selectedFlavor?.name)
    : null;
  const currentVariantWeight = productCategory === 'cakes'
    ? (showCustomWeightInput ? customWeight : selectedWeight)
    : null;

  // Find cart item with same variant
  const cartItem = cartItems?.find(i =>
    idsMatch(i.productId, productId) &&
    (productCategory !== 'cakes' || (i.selectedFlavor === currentVariantFlavor && i.selectedWeight === currentVariantWeight))
  );
  const cartQty = cartItem?.qty || 0;
  const isWishlisted = product ? isInWishlist(productId) : false;

  // ─── PRICE LOGIC ───────────────────────────────────────
  const getCurrentPrice = () => {
    return productCategory === 'cakes' && selectedPrice
      ? selectedPrice
      : productPrice;
  };

  const currentPrice = getCurrentPrice();
  const hasOffer = productOfferPrice > 0 && productOfferPrice < currentPrice;
  const basePrice = hasOffer ? productOfferPrice : currentPrice;
  const offerDiscount = currentPrice - basePrice;
  const offerPct = currentPrice > 0 ? Math.round((offerDiscount / currentPrice) * 100) : 0;

  const normalizeCouponCode = (c) => (c != null && String(c).trim() !== '' ? String(c).trim().toUpperCase() : '');

  // Cart coupon matches this product's offer (server stores uppercase code)
  const isCouponApplied =
    !!normalizeCouponCode(appliedCoupon) &&
    !!normalizeCouponCode(product?.coupon?.code) &&
    normalizeCouponCode(appliedCoupon) === normalizeCouponCode(product?.coupon?.code);

  const hasAnyCartCoupon = !!normalizeCouponCode(appliedCoupon);
  const otherCouponBlocksApply = hasAnyCartCoupon && !isCouponApplied && !!product?.coupon?.enabled;

  // Calculate discount per unit
  const getCouponSavingsPerUnit = () => {
    if (!isCouponApplied || !product?.coupon?.enabled) return 0;
    return getCouponUnitDiscount(basePrice, product.coupon);
  };

  const couponSavingsPerUnit = getCouponSavingsPerUnit();
  const discountedPricePerUnit = Math.max(0, basePrice - couponSavingsPerUnit);

  // Total calculations with quantity
  const totalOriginalPrice = currentPrice * quantity;
  const totalBasePrice = basePrice * quantity;
  const totalOfferDiscount = offerDiscount * quantity;
  const totalCouponDiscount = couponSavingsPerUnit * quantity;
  const totalFinalPrice = discountedPricePerUnit * quantity;
  const totalSavings = totalOriginalPrice - totalFinalPrice;
  const totalSavingsPct = totalOriginalPrice > 0 ? Math.round((totalSavings / totalOriginalPrice) * 100) : 0;

  // For UI display consistency
  const finalPrice = totalFinalPrice;
  const couponSavings = totalCouponDiscount;

  // Check if variant is in stock
  const isInStock = productCategory === 'cakes'
    ? (selectedStock > 0)
    : (productStock > 0);

  // ─── COUPON ACTIONS ───────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!product?.coupon?.enabled) {
      toast.error('No coupon available for this product');
      return;
    }
    if (otherCouponBlocksApply) {
      toast.error('Remove the active coupon from your cart to use this code.');
      return;
    }

    setApplyingCoupon(true);

    try {
      const isInCart = cartItems?.some(item =>
        idsMatch(item.productId, product._id) &&
        (product.category !== 'cakes' ||
          (item.selectedFlavor === currentVariantFlavor &&
            item.selectedWeight === currentVariantWeight))
      );

      if (!isInCart && quantity > 0) {
        const options = {};
        if (product?.category === 'cakes') {
          if (showCustomFlavorInput && customFlavor) {
            options.flavor = customFlavor;
          } else if (selectedFlavor) {
            options.flavor = selectedFlavor.name;
          }
          if (showCustomWeightInput && customWeight) {
            options.weight = customWeight;
          } else if (selectedWeight) {
            options.weight = selectedWeight;
          }
        }
        dispatch(addToCart({ product, qty: quantity, options }));
        toast.success(`${quantity} item(s) added to cart`);
      }

      dispatch(setCoupon(product.coupon.code));
      toast.success(`${product.coupon.code} applied`);

    } catch (err) {
      console.error('Coupon application error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to apply coupon. Please try again.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      toast.success('Coupon removed');
      await fetchCart();
    } catch (err) {
      toast.error('Failed to remove coupon');
    }
  };

  // ─── CART QUANTITY UPDATES ──────────────────────────
  const handleUpdateQuantity = (id, newQty) => {
    if (newQty < 1) {
      // Logic for removing if quantity is 0 could go here if needed
      return;
    }
    dispatch(updateCartQty({ productId: id, qty: newQty }));
  };

  // ─── ADD TO CART ───────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!isInStock) {
      toast.error('Out of stock');
      return;
    }
    
    // Stock Validation
    const currentStockLimit = productCategory === 'cakes' ? selectedStock : productStock;
    if (cartQty + 1 > currentStockLimit) {
      toast.error(`Only ${currentStockLimit} units available`);
      return;
    }

    setAddingToCart(true);
    const options = {};
    if (productCategory === 'cakes') {
      if (showCustomFlavorInput && customFlavor) options.flavor = customFlavor;
      else if (selectedFlavor) options.flavor = selectedFlavor.name;
      else { toast.error('Please select flavor'); setAddingToCart(false); return; }

      if (showCustomWeightInput && customWeight) options.weight = customWeight;
      else if (selectedWeight) options.weight = selectedWeight;
      else { toast.error('Please select weight'); setAddingToCart(false); return; }
    }

    dispatch(addToCart({ product, qty: 1, options }));
    toast.success(`Item added to cart!`);
    setAddingToCart(false);
  };

  // ─── BUY NOW ──
  const handleBuyNow = async () => {
    if (!isInStock) {
      toast.error('Out of stock');
      return;
    }

    // Validate cake selections before proceeding
    if (productCategory === 'cakes') {
      if (!currentVariantFlavor) { toast.error('Please select flavor'); return; }
      if (!currentVariantWeight) { toast.error('Please select weight'); return; }
    }

    const directItem = {
      productId: productId,
      name: productName,
      image: displayImage || product.image,
      price: productPrice,
      offerPrice: productOfferPrice,
      qty: 1,
      selectedFlavor: currentVariantFlavor,
      selectedWeight: currentVariantWeight,
      coupon: product.coupon,
      stock: productCategory === 'cakes' ? selectedStock : productStock
    };

    navigate('/checkout', { state: { directItem } });
  };

  // Get valid flavor images
  const getFlavorImages = (flavor) => {
    if (!flavor || !flavor.images) return [];
    return flavor.images.filter(img => img && !img.startsWith('blob:'));
  };



  // ─── LOADER ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted font-black uppercase tracking-widest">Preparing your treats...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-2xl font-black text-heading uppercase tracking-tight">Product Not Found</p>
          <p className="text-sm text-muted">This product may have been removed or is unavailable.</p>
          <button onClick={() => navigate('/shop')} className="mt-4 px-6 py-3 bg-primary text-button-text rounded-2xl font-black text-xs uppercase tracking-widest">
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12">
      {/* ── BREADCRUMB ── */}
      <div className="bg-card border-b border-border hidden lg:block">

        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
            <button onClick={() => navigate('/')} className="hover:text-primary transition">Home</button>
            <ChevronRight size={12} />
            <button onClick={() => navigate(`/shop?category=${product?.category}`)} className="hover:text-primary transition capitalize">{product?.category}</button>
            <ChevronRight size={12} />
            <span className="text-heading truncate max-w-[200px]">{product?.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-4 lg:px-8 xl:px-12 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">

          {/* ── LEFT — IMAGE SECTION ── */}
          <div className="w-full space-y-6">
            <div className="relative bg-card lg:rounded-[2.5rem] overflow-hidden border-b lg:border border-border/50 cursor-zoom-in group shadow-premium transition-all duration-500" onClick={() => setImgZoom(!imgZoom)}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={displayImage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={displayImage || undefined}
                  onError={(e) => { e.target.src = product?.image || ''; }}
                  className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </AnimatePresence>

              {offerPct > 0 && (
                <div className="absolute top-6 left-6 bg-sale text-button-text text-xs font-black px-4 py-2 rounded-xl shadow-lg z-10 uppercase tracking-widest">
                  {offerPct}% OFF
                </div>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); toggleWishlist(product._id); }}
                className="absolute top-6 right-6 bg-card/85 backdrop-blur-md shadow-xl p-3 rounded-full hover:scale-110 transition-all z-10 group/heart border border-border/50"
              >

                <Heart
                  size={24}
                  fill={isWishlisted ? 'var(--error)' : 'none'}
                  className={`${isWishlisted ? 'text-error' : 'text-muted'} transition-colors group-hover/heart:text-error`}
                />
              </button>

              {product.bestseller && (
                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-secondary text-button-text text-xs font-black px-5 py-2.5 rounded-full uppercase tracking-widest shadow-xl z-10">
                  <Sparkles size={14} fill="currentColor" />
                  Bestseller
                </div>
              )}
            </div>

            {/* Cake Flavor Gallery Thumbnails */}
            {product?.category === 'cakes' && selectedFlavor && getFlavorImages(selectedFlavor).length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {getFlavorImages(selectedFlavor).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDisplayImage(img)}
                    className="w-20 h-20 rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-all flex-shrink-0"
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Highlights Grid */}
            <div className="hidden lg:grid grid-cols-3 gap-6">
              {[
                { icon: Truck, label: 'Free Delivery', sub: 'On all orders' },
                { icon: RotateCcw, label: 'Fresh Daily', sub: 'Baked today' },
                { icon: ShieldCheck, label: 'Secure Pay', sub: '100% safe' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-card rounded-3xl border border-border/50 p-6 flex flex-col items-center text-center gap-2 hover:shadow-premium hover:-translate-y-1 transition-all duration-300">
                  <Icon size={28} className="text-primary mb-1" />
                  <p className="text-sm font-black uppercase tracking-wider text-heading">{label}</p>
                  <p className="text-[11px] text-muted font-medium">{sub}</p>
                </div>
              ))}
            </div>

            {/* Info Section */}
            <div className="space-y-6 pt-4 hidden lg:block">
              {/* Description Box */}
              <div className="bg-card rounded-[2.5rem] border border-border/50 p-8 shadow-sm">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-heading mb-4">Description</h3>
                <p className="text-sm text-muted font-medium leading-relaxed tracking-wide italic">"{product.description}"</p>
              </div>

              {/* Highlights Box */}
              <div className="bg-card rounded-[2.5rem] border border-border/50 p-8 shadow-sm">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-heading mb-6">Highlights</h3>
                <div className="grid grid-cols-2 gap-y-5 gap-x-6">
                  {(product.occasion?.length > 0 ? product.occasion : ['Freshly Baked', 'Premium Quality', 'Eggless Available']).map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-success-light flex items-center justify-center border border-success/10 flex-shrink-0">
                        <CheckCircle2 size={12} className="text-success" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-heading">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT — DETAILS ── */}
          <div className="w-full lg:sticky lg:top-24 space-y-6 px-1 lg:px-0">
            {/* Main Header Card */}
            <div className="bg-card rounded-[2.5rem] border border-border/50 p-6 lg:p-10 shadow-card hover:shadow-premium transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-black text-primary uppercase bg-primary/5 px-4 py-1.5 rounded-full tracking-widest border border-primary/10">
                  {productCategory}
                </span>
                <button className="p-2.5 text-muted hover:text-primary transition-colors bg-card-soft rounded-full border border-border/40 shadow-soft"><Share2 size={18} /></button>
              </div>

              <h1 className="text-3xl lg:text-4xl font-black text-heading leading-[1.1] mb-4 capitalize tracking-tight">{productName}</h1>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1.5 bg-success text-button-text px-3 py-1 rounded-xl text-xs font-black shadow-sm">
                  {product?.ratingsAverage || 0} <Star size={12} fill="currentColor" />
                </div>
                <span className="text-xs text-muted font-black uppercase tracking-widest">{product?.ratingsCount || 0} verified ratings</span>
              </div>

              {/* Cake Flavor and Weight Selection */}
              {product?.category === 'cakes' && product.hasVariants && (
                <div className="space-y-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Cake size={16} className="text-primary" />
                      <label className="text-[11px] font-black text-muted uppercase tracking-widest">Select Flavor</label>
                    </div>

                    {!showCustomFlavorInput ? (
                      <>
                        <div className="flex flex-wrap gap-3">
                          {product.flavors?.map((flavor, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleFlavorChange(flavor)}
                              className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide transition-all ${selectedFlavor?.name === flavor.name
                                ? 'bg-primary text-button-text shadow-lg scale-105'
                                : 'bg-muted/10 text-heading border-2 border-border hover:border-primary/50'
                                }`}
                            >
                              {flavor.name}
                            </button>
                          ))}
                        </div>
                        {product.allowCustomFlavor && (
                          <button
                            onClick={() => setShowCustomFlavorInput(true)}
                            className="text-xs text-primary font-black underline"
                          >
                            + Add Custom Flavor
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customFlavor}
                          onChange={(e) => setCustomFlavor(e.target.value)}
                          placeholder="Enter custom flavor"
                          className="flex-1 bg-input border border-input-border px-4 py-2 rounded-xl text-sm"
                        />
                        <button
                          onClick={handleCustomFlavorSubmit}
                          className="px-4 py-2 bg-primary text-button-text rounded-xl text-xs font-black"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowCustomFlavorInput(false)}
                          className="px-4 py-2 bg-card-soft text-heading rounded-xl text-xs font-black border border-border"
                        >
                          Cancel
                        </button>

                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Scale size={16} className="text-primary" />
                      <label className="text-[11px] font-black text-muted uppercase tracking-widest">Select Weight</label>
                    </div>

                    {!showCustomWeightInput ? (
                      <>
                        <div className="flex flex-wrap gap-3">
                          {product.weights?.map((weight, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleWeightChange(weight.value)}
                              className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide transition-all ${selectedWeight === weight.value
                                ? 'bg-primary text-button-text shadow-lg scale-105'
                                : 'bg-muted/10 text-heading border-2 border-border hover:border-primary/50'
                                }`}
                            >
                              {weight.value}
                            </button>
                          ))}
                        </div>
                        {product.allowCustomWeight && (
                          <button
                            onClick={() => setShowCustomWeightInput(true)}
                            className="text-xs text-primary font-black underline"
                          >
                            + Add Custom Weight
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customWeight}
                          onChange={(e) => setCustomWeight(e.target.value)}
                          placeholder="Enter custom weight (e.g., 2.5 kg)"
                          className="flex-1 bg-input border border-input-border px-4 py-2 rounded-xl text-sm"
                        />
                        <button
                          onClick={handleCustomWeightSubmit}
                          className="px-4 py-2 bg-primary text-button-text rounded-xl text-xs font-black"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowCustomWeightInput(false)}
                          className="px-4 py-2 bg-card-soft text-heading rounded-xl text-xs font-black border border-border"
                        >
                          Cancel
                        </button>

                      </div>
                    )}
                  </div>

                  {!isInStock && (
                    <div className="text-center py-2 bg-error-light text-error-text border border-error/10 rounded-xl text-xs font-black uppercase tracking-widest">
                      Out of Stock for this combination
                    </div>

                  )}
                </div>
              )}

              {/* ========== ACTION CARD SECTION ========== */}
              {/* Organized in proper order: Price → Coupon → Quantity → Buttons */}
              <div className="space-y-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-black text-heading tracking-tighter">{formatCurrency(finalPrice)}</span>
                  {currentPrice > finalPrice && (
                    <span className="text-xl line-through text-muted/40 font-black tracking-tighter">{formatCurrency(currentPrice)}</span>
                  )}
                  {totalSavingsPct > 0 && (
                    <span className="text-base font-black text-success-text bg-success-light px-3 py-1 rounded-lg uppercase tracking-wide border border-success/10">
                      {totalSavingsPct}% off
                    </span>
                  )}
                </div>

                <div className="bg-muted/5 rounded-3xl p-6 space-y-3 text-sm font-bold border border-border/20">
                  <div className="flex justify-between text-muted/60 uppercase text-[10px] tracking-widest">
                    <span>MRP (Inclusive of all taxes)</span>
                    <span>{formatCurrency(currentPrice)}</span>
                  </div>
                  {offerDiscount > 0 && (
                    <div className="flex justify-between text-success-text uppercase text-[10px] tracking-widest">
                      <span>Offer Savings</span>
                      <span>- {formatCurrency(offerDiscount)}</span>
                    </div>
                  )}
                  {couponSavings > 0 && (
                    <div className="flex justify-between text-success-text uppercase text-[10px] tracking-widest">
                      <span>Coupon Discount ({product.coupon.code})</span>
                      <span>- {formatCurrency(couponSavings)}</span>
                    </div>
                  )}
                  <div className="border-t border-border/30 pt-3 flex justify-between font-black text-heading text-lg tracking-tight">
                    <span className="uppercase text-[11px] tracking-widest self-center text-muted">Final Price</span>
                    <span>{formatCurrency(finalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coupon Card — Premium Style */}
            {product?.coupon?.enabled && (
              <div className="bg-card rounded-[2.5rem] border p-6 lg:p-8 shadow-sm relative overflow-hidden group/coupon">
                <div className="absolute -top-4 -right-4 p-2 opacity-[0.03] rotate-12 transition-transform group-hover/coupon:rotate-45 duration-700">
                  <Percent size={120} />
                </div>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">
                  {isCouponApplied ? 'Coupon applied to your order' : 'Available Exclusive Offer'}
                </p>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-coupon/10 border border-coupon/20 border-dashed rounded-[1.5rem] p-5 lg:p-6 ${isCouponApplied ? 'border-success/30 bg-success-light/40' : ''}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="bg-card p-3 rounded-2xl shadow-soft border border-border/50 flex-shrink-0">
                      {isCouponApplied ? (
                        <CheckCircle2 size={20} className="text-success" />
                      ) : (
                        <Tag size={20} className="text-coupon" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-heading text-lg font-mono tracking-widest">{product.coupon.code}</p>
                      {isCouponApplied && (
                        <p className="text-[10px] font-black text-success-text uppercase tracking-widest mt-1 flex items-center gap-1">
                          <Sparkles size={12} className="text-success" />
                          Applied — savings reflected above
                        </p>
                      )}
                      {!isCouponApplied && (
                        <p className="text-[11px] font-black text-coupon uppercase tracking-wider opacity-80">
                          {product.coupon.type === 'percent'
                            ? `${product.coupon.value}% Instant OFF`
                            : product.coupon.type === 'price'
                              ? `Special price ₹${product.coupon.value}`
                              : `Flat ₹${product.coupon.value} OFF`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                    {otherCouponBlocksApply && (
                      <p className="text-[10px] text-muted font-bold uppercase tracking-wider text-center sm:text-right max-w-[220px] sm:max-w-[200px]">
                        Cart already has <span className="font-mono text-heading">{appliedCoupon}</span>. Remove it in the cart to use this code.
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={applyingCoupon || (otherCouponBlocksApply && !isCouponApplied)}
                      onClick={isCouponApplied ? handleRemoveCoupon : handleApplyCoupon}
                      className={`text-[11px] font-black px-6 py-3 rounded-xl transition-all uppercase tracking-widest shadow-sm disabled:opacity-50 disabled:pointer-events-none ${isCouponApplied ? 'bg-card text-error border border-error/20 hover:bg-error-light' : 'bg-primary text-button-text hover:bg-primary-hover shadow-primary/20'}`}
                    >
                      {applyingCoupon ? '…' : isCouponApplied ? 'Remove coupon' : 'Apply'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons Section — Desktop Only */}
            <div className="hidden lg:grid grid-cols-2 gap-4 bg-card rounded-[2.5rem] border p-8 shadow-sm">
              <div className="col-span-2 mb-2 flex items-center gap-3 bg-muted/5 p-4 rounded-2xl border border-border/20">
                <div className={`w-2.5 h-2.5 rounded-full ${isInStock ? 'bg-success animate-pulse' : 'bg-error'}`} />
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isInStock ? 'text-success-text' : 'text-error-text'}`}>
                  {isInStock 
                    ? `${productCategory === 'cakes' ? selectedStock : productStock} UNITS AVAILABLE & READY TO SHIP` 
                    : 'CURRENTLY OUT OF STOCK'}
                </span>
              </div>

              {cartQty > 0 ? (
                <div className="flex items-center border-2 border-border/30 rounded-2xl h-16 bg-muted/5">
                  <button onClick={() => handleUpdateQuantity(productId, cartQty - 1)} className="w-16 h-full flex items-center justify-center hover:bg-muted/10 transition"><Minus size={20} /></button>
                  <span className="flex-1 text-center font-black text-xl text-heading">{cartQty}</span>
                  <button onClick={() => handleUpdateQuantity(productId, cartQty + 1)} className="w-16 h-full flex items-center justify-center hover:bg-muted/10 transition"><Plus size={20} /></button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock || addingToCart}
                  className={`h-16 border-2 border-primary text-primary font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition flex items-center justify-center gap-3 ${!isInStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/5'}`}
                >
                  {addingToCart ? <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <ShoppingCart size={20} />} 
                  {isInStock ? 'Add to Cart' : 'Sold Out'}
                </button>
              )}

              <button
                onClick={handleBuyNow}
                disabled={!isInStock}
                className={`h-16 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition shadow-xl flex items-center justify-center gap-3 ${isInStock
                  ? 'bg-secondary text-button-text shadow-secondary/20 hover:brightness-110 cursor-pointer'
                  : 'bg-muted/40 text-muted/60 cursor-not-allowed shadow-none'
                  }`}
              >
                {isInStock ? 'Buy Now' : 'Out of Stock'} <ArrowRight size={20} />
              </button>
            </div>

            {cartQty > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 py-2 bg-primary/5 rounded-xl border border-primary/10"
              >
                <CheckCircle2 size={14} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {cartQty} {cartQty === 1 ? 'item' : 'items'} already in your cart
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Info Section */}
      <div className="space-y-4 block lg:hidden">
        <div className="bg-card rounded-[2rem] border border-border/50 p-6 shadow-card">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-heading mb-4">Description</h3>
          <p className="text-sm text-muted font-medium leading-relaxed tracking-wide italic">"{productDescription}"</p>
        </div>
        <div className="bg-card rounded-[2rem] border border-border/50 p-6 shadow-card">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-heading mb-6">Highlights</h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-4">
            {['Freshly Baked', 'Premium Quality', 'Eggless Available', 'No Preservatives', 'Secure Packing', 'Fast Delivery'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-success-light flex items-center justify-center border border-success/10 flex-shrink-0">
                  <CheckCircle2 size={10} className="text-success" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-heading">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RATINGS & REVIEWS SECTION ── */}
      <div className="mt-12 lg:mt-16 bg-card rounded-[2.5rem] border border-border/50 p-6 lg:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-heading mb-2 uppercase tracking-tight">Ratings & Reviews</h2>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 bg-success text-button-text px-3 py-1.5 rounded-lg text-lg font-black shadow-sm">
                {product.ratingsAverage || 0} <Star size={16} fill="currentColor" />
              </div>
              <span className="text-sm font-bold text-muted uppercase tracking-widest">{product.ratingsCount || 0} Verified Reviews</span>
            </div>
          </div>
        </div>

        {productReviews.length > 0 ? (
          <div className="relative reviews-swiper-wrapper">
            <style>{`
              .reviews-swiper-wrapper .swiper-pagination {
                bottom: 0px !important;
              }
              .reviews-swiper-wrapper .swiper-pagination-bullet {
                width: 8px;
                height: 8px;
                background: var(--primary);
                opacity: 0.25;
                transition: all 0.3s ease;
              }
              .reviews-swiper-wrapper .swiper-pagination-bullet-active {
                opacity: 1;
                width: 24px;
                border-radius: 4px;
              }
            `}</style>
            <Swiper
              modules={[Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              pagination={{ clickable: true, dynamicBullets: true }}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="pb-16"
            >
              {productReviews.map((rev, i) => (
                <SwiperSlide key={i}>
                  <div className="rounded-[2.5rem] p-8 h-full flex flex-col transition-all duration-500 cutting-edge-border hover:shadow-premium">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, idx) => (
                          <Star key={idx} size={14} fill={idx < rev.rating ? "var(--star)" : "none"} className={idx < rev.rating ? "text-star" : "text-muted/20"} />
                        ))}
                      </div>
                      {rev.rating >= 4 && (
                        <span className="text-[9px] font-black text-success-text bg-success-light border border-success/10 px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-heading font-medium italic leading-relaxed line-clamp-4 mb-6 flex-1 opacity-90">
                      "{rev.comment}"
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border/20">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                        {rev.userName?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-heading capitalize">{rev.userName || 'Verified Customer'}</p>
                        <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-0.5">Purchased recently</p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <div className="text-center py-20 bg-surface/5 rounded-[2.5rem] border border-dashed border-border/50">
            <Info className="mx-auto text-muted/30 mb-4" size={48} />
            <p className="text-lg font-black text-heading uppercase tracking-widest opacity-30">No reviews yet for this delight</p>
            <p className="text-sm text-muted mt-2">Be the first to share your experience!</p>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 lg:mt-24 px-5 lg:px-0">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl lg:text-3xl font-black text-heading uppercase tracking-tight">You might also love</h2>
            <Link to="/shop" className="text-xs font-black text-primary uppercase tracking-[0.2em] border-b-2 border-primary/20 pb-1 hover:border-primary transition-all">View All Delights</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {relatedProducts.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      )}
      {/* ── MOBILE FIXED ACTION BAR (Flipkart Style) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[110] bg-card border-t border-border p-3 grid grid-cols-2 gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        {cartQty > 0 ? (
          <div className="flex items-center border-2 border-border/30 rounded-xl h-14 bg-muted/5">
            <button onClick={() => handleUpdateQuantity(productId, cartQty - 1)} className="w-12 h-full flex items-center justify-center hover:bg-muted/10 transition"><Minus size={18} /></button>
            <span className="flex-1 text-center font-black text-lg text-heading">{cartQty}</span>
            <button onClick={() => handleUpdateQuantity(productId, cartQty + 1)} className="w-12 h-full flex items-center justify-center hover:bg-muted/10 transition"><Plus size={18} /></button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={!isInStock}
            className={`h-14 border-2 border-primary text-primary font-black text-[10px] uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 ${!isInStock ? 'opacity-50' : 'active:scale-95'}`}
          >
            <ShoppingCart size={18} /> {isInStock ? 'Add to Cart' : 'Sold Out'}
          </button>
        )}

        <button
          onClick={handleBuyNow}
          disabled={!isInStock}
          className={`h-14 font-black text-[10px] uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${isInStock
            ? 'bg-secondary text-button-text shadow-secondary/20 active:scale-95'
            : 'bg-muted/40 text-muted/60 cursor-not-allowed'
            }`}
        >
          {isInStock ? 'Buy Now' : 'Out of Stock'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
