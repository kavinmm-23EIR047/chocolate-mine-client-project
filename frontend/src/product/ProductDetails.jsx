import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Star, Share2, CheckCircle2, ChevronRight, Sparkles, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { useGetProductBySlugQuery, useGetProductsQuery } from './productApi';
import { useGetProductReviewsQuery } from '../services/api/reviewApi';
import { addToCart, updateCartQty, setCoupon } from '../redux/slices/cartSlice';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrency, getCouponUnitDiscount, idsMatch } from '../utils/helpers';
import ProductCard from './ProductCard';
import PureVegBadge from '../components/ui/PureVegBadge';

import ProductGallery from './components/ProductGallery';
import ProductDescription from './components/ProductDescription';
import ProductVariants from './components/ProductVariants';
import ProductPricing from './components/ProductPricing';
import ProductActionButtons from './components/ProductActionButtons';
import ProductReviews from './components/ProductReviews';
import ProductRelated from './components/ProductRelated';
import ProductSimilar from './components/ProductSimilar';

// Flavor price lookup for bento cakes (used as fallback if DB data lacks prices)
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

// Helper: get flavor price (from DB or fallback)
const getFlavorPrice = (flavor) => {
  if (flavor?.price) return Number(flavor.price);
  if (flavor?.name && BENTO_FLAVOR_PRICES[flavor.name]) return BENTO_FLAVOR_PRICES[flavor.name];
  return 0;
};

const getWeightMultiplier = (weightStr) => {
  if (!weightStr) return 1;
  const w = String(weightStr).toLowerCase().replace(/\s+/g, '');
  if (w.includes('250g')) return 1;
  if (w.includes('500g')) return 1;
  if (w.includes('1.5kg')) return 3;
  if (w.includes('2.5kg')) return 5;
  if (w.includes('1kg')) return 2;
  if (w.includes('2kg')) return 4;
  if (w.includes('3kg')) return 6;
  return 1;
};

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: productRes, isLoading: loading } = useGetProductBySlugQuery(slug);
  const product = productRes?.data;
  const isCake = Array.isArray(product?.category) ? product.category.some(c => typeof c === 'string' && c.toLowerCase().includes('cake')) : (product?.category || '').toLowerCase().includes('cake');

  const productId = product?._id?.$oid || product?._id;
  const { data: reviewRes } = useGetProductReviewsQuery(productId, { skip: !productId });
  const productReviews = reviewRes?.data?.reviews || [];

  const { user } = useAuth();
  const cartItems = useSelector((state) => state.cart.items);
  const appliedCoupon = useSelector((state) => state.cart.appliedCoupon);
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [relatedProducts, setRelatedProducts] = useState([]);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Fetch similar products in the same category
  const { data: similarRes } = useGetProductsQuery({
    category: Array.isArray(product?.category) && product.category.length > 0 ? product.category[0] : product?.category,
    limit: 5
  }, { skip: !(Array.isArray(product?.category) ? product.category.length > 0 : product?.category) });

  const { data: relatedRes } = useGetProductsQuery({
    category: Array.isArray(product?.category) && product.category.length > 0 ? product.category[0] : product?.category,
    limit: 10
  }, { skip: !(Array.isArray(product?.category) ? product.category.length > 0 : product?.category) });

  useEffect(() => {
    // Fetch Addons
    import('../services/productService').then(({ default: productService }) => {
      productService.getActiveAddons().then(res => {
        setAvailableAddons(res.data?.data || []);
      }).catch(err => console.error('Failed to fetch addons:', err));
    });
  }, []);

  useEffect(() => {
    if (relatedRes?.data && product) {
      const filtered = relatedRes.data.filter(p => (p._id?.$oid || p._id) !== productId);
      setRelatedProducts(filtered.slice(0, 4));
    }
  }, [relatedRes, product, productId]);

  const handleAddonToggle = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a._id === addon._id);
      if (exists) {
        return prev.filter(a => a._id !== addon._id);
      }
      return [...prev, { ...addon, qty: 1 }];
    });
  };

  const handleAddonIncrement = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a._id === addon._id);
      if (exists) {
        return prev.map(a => a._id === addon._id ? { ...a, qty: (a.qty || 1) + 1 } : a);
      }
      return [...prev, { ...addon, qty: 1 }];
    });
  };

  const handleAddonDecrement = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a._id === addon._id);
      if (exists) {
        if ((exists.qty || 1) <= 1) {
          return prev.filter(a => a._id !== addon._id);
        }
        return prev.map(a => a._id === addon._id ? { ...a, qty: (a.qty || 1) - 1 } : a);
      }
      return prev;
    });
  };

  const selectedAddonQty = (addon) => {
    const exists = selectedAddons.find(a => a._id === addon._id);
    return exists ? (exists.qty || 1) : 0;
  };

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
      if (isCake) {
        const isBento = (Array.isArray(product?.category) ? product.category.some(c => typeof c === 'string' && c.toLowerCase().includes('bento')) : (product?.category || '').toLowerCase().includes('bento')) || product?.cakeType?.toLowerCase().includes('bento');
        const defaultWeight = isBento ? '250g' : '500g';
        setSelectedWeight(defaultWeight);
        
        const basePriceVal = Number(product.price || 0);
        setSelectedPrice(basePriceVal);
        setSelectedStock(product.stock !== undefined ? product.stock : true);

        if (product.flavors && product.flavors.length > 0) {
          const initialFlavor = product.flavors[0];
          setSelectedFlavor(initialFlavor);
          
          const flavorPrice = getFlavorPrice(initialFlavor);
          setSelectedPrice(basePriceVal + flavorPrice);

          if (initialFlavor.images && initialFlavor.images.length > 0) {
            setDisplayImage(initialFlavor.images[0]);
          } else {
            setDisplayImage(product.image || null);
          }
        } else {
          setSelectedFlavor({ name: 'Standard' });
          setDisplayImage(product.image || null);
        }
      } else {
        setDisplayImage(product.image || null);
        setSelectedStock(product.stock);
      }
    }
  }, [product]);

  const getPriceForWeight = (prod, weightStr) => {
    if (!prod) return null;
    const num = parseFloat(String(weightStr || '').replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && prod.weightPrices && Array.isArray(prod.weightPrices)) {
      const found = prod.weightPrices.find(wp => Number(wp.weight) === num);
      if (found) return found.price;
    }
    const variantFallback = prod.variants?.find(v => v.weight === weightStr);
    return variantFallback ? variantFallback.price : null;
  };

  const handleFlavorChange = (flavor) => {
    setSelectedFlavor(flavor);
    setShowCustomFlavorInput(false);
    setCustomFlavor('');

    const basePriceVal = Number(product.price || 0);
    const flavorPrice = getFlavorPrice(flavor);
    
    // Only update selectedPrice if we are not relying on weight multiplier.
    // For bento cakes (where weight is fixed or hidden), this correctly adds flavor price.
    setSelectedPrice(basePriceVal + flavorPrice);

    if (flavor.images && flavor.images.length > 0) {
      setDisplayImage(flavor.images[0]);
    }
  };

  const handleWeightChange = (weight) => {
    setSelectedWeight(weight);
    setShowCustomWeightInput(false);
    setCustomWeight('');

    const multiplier = getWeightMultiplier(weight);
    const basePriceVal = Number(product.price || 0);
    setSelectedPrice(basePriceVal * multiplier);
    setSelectedStock(product.stock !== undefined ? product.stock : true);
  };

  const handleCustomFlavorSubmit = () => {
    if (customFlavor.trim()) {
      setSelectedFlavor({ name: customFlavor.trim(), images: [] });
      setShowCustomFlavorInput(false);
    }
  };

  const handleCustomWeightSubmit = () => {
    if (customWeight.trim()) {
      setSelectedWeight(customWeight.trim());
      setShowCustomWeightInput(false);
    }
  };

  // ─── BACKEND DATA MAPPING ─────────────────────────────
  const productName = product?.name;
  const productPrice = Number(product?.price || 0);
  const productOfferPrice = Number(product?.offerPrice || 0);
  const productAvailable = product?.stock !== false;
  const productCategory = Array.isArray(product?.category) ? product.category.join(' ') : product?.category;

  const currentVariantFlavor = isCake
    ? (showCustomFlavorInput ? customFlavor : selectedFlavor?.name)
    : null;
  const currentVariantWeight = isCake
    ? (showCustomWeightInput ? customWeight : selectedWeight)
    : null;

  const cartItem = cartItems?.find(i =>
    idsMatch(i.productId, productId) &&
    (!isCake || (i.options?.flavor === currentVariantFlavor && i.options?.weight === currentVariantWeight))
  );
  const cartQty = cartItem?.qty || 0;
  const isWishlisted = product ? isInWishlist(productId) : false;

  // ─── PRICE LOGIC ───────────────────────────────────────
  const getCurrentPrice = () => {
    return isCake && selectedPrice
      ? selectedPrice
      : productPrice;
  };

  const currentPrice = getCurrentPrice();
  const isCakeWithVariants = isCake;
  const hasOffer = !isCakeWithVariants && productOfferPrice > 0 && productOfferPrice < currentPrice;
  const basePrice = hasOffer ? productOfferPrice : currentPrice;
  const offerDiscount = currentPrice - basePrice;
  const offerPct = currentPrice > 0 ? Math.round((offerDiscount / currentPrice) * 100) : 0;

  const normalizeCouponCode = (c) => (c != null && String(c).trim() !== '' ? String(c).trim().toUpperCase() : '');

  const isCouponApplied =
    !!normalizeCouponCode(appliedCoupon) &&
    !!normalizeCouponCode(product?.coupon?.code) &&
    normalizeCouponCode(appliedCoupon) === normalizeCouponCode(product?.coupon?.code);

  const getCouponSavingsPerUnit = () => {
    if (!isCouponApplied || !product?.coupon?.enabled) return 0;
    return getCouponUnitDiscount(basePrice, product.coupon);
  };

  const couponSavingsPerUnit = getCouponSavingsPerUnit();
  const discountedPricePerUnit = Math.max(0, basePrice - couponSavingsPerUnit);

  const totalOriginalPrice = currentPrice * quantity;
  const totalFinalPrice = discountedPricePerUnit * quantity;
  const totalSavings = totalOriginalPrice - totalFinalPrice;
  const totalSavingsPct = totalOriginalPrice > 0 ? Math.round((totalSavings / totalOriginalPrice) * 100) : 0;

  const addonSum = selectedAddons.reduce((sum, a) => sum + (Number(a.price || 0) * (a.qty || 1)), 0);
  const finalPrice = totalFinalPrice + addonSum;
  const couponSavings = couponSavingsPerUnit * quantity;

  const isInStock = isCake ? (selectedStock !== false) : productAvailable;

  // ─── ACTIONS ───────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!product?.coupon?.enabled) {
      toast.error('No coupon available for this product');
      return;
    }
    setApplyingCoupon(true);

    try {
      const isInCart = cartItems?.some(item =>
        idsMatch(item.productId, product._id) &&
        (!isCake ||
          (item.selectedFlavor === currentVariantFlavor &&
            item.selectedWeight === currentVariantWeight))
      );

      if (!isInCart && quantity > 0) {
        const options = {};
        if (isCake) {
          if (showCustomFlavorInput && customFlavor) options.flavor = customFlavor;
          else if (selectedFlavor) options.flavor = selectedFlavor.name;
          
          if (showCustomWeightInput && customWeight) options.weight = customWeight;
          else if (selectedWeight) options.weight = selectedWeight;
        }
        dispatch(addToCart({ product, qty: quantity, options, variantPrice: isCakeWithVariants ? currentPrice : null, addons: selectedAddons }));
        toast.success(`${quantity} item(s) added to cart`);
      }

      dispatch(setCoupon(product.coupon.code));
      toast.success(`${product.coupon.code} applied`);
    } catch (err) {
      console.error('Coupon application error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to apply coupon.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(setCoupon(null));
    toast.success('Coupon removed');
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    dispatch(updateCartQty({ productId: id, qty: newQty }));
  };

  const handleAddToCart = async () => {
    if (!isInStock) {
      toast.error('Not available');
      return;
    }

    setAddingToCart(true);
    const options = {};
    if (isCake) {
      if (showCustomFlavorInput && customFlavor) options.flavor = customFlavor;
      else if (selectedFlavor) options.flavor = selectedFlavor.name;
      else { toast.error('Please select flavor'); setAddingToCart(false); return; }

      if (showCustomWeightInput && customWeight) options.weight = customWeight;
      else if (selectedWeight) options.weight = selectedWeight;
      else { toast.error('Please select weight'); setAddingToCart(false); return; }
    }

    dispatch(addToCart({ product, qty: 1, options, variantPrice: isCakeWithVariants ? currentPrice : null, addons: selectedAddons }));
    toast.success(`Item added to cart!`);
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    if (!isInStock) {
      toast.error('Not available');
      return;
    }

    const options = {};
    if (isCake) {
      if (showCustomFlavorInput && customFlavor) options.flavor = customFlavor;
      else if (selectedFlavor) options.flavor = selectedFlavor.name;
      else { toast.error('Please select flavor'); return; }

      if (showCustomWeightInput && customWeight) options.weight = customWeight;
      else if (selectedWeight) options.weight = selectedWeight;
      else { toast.error('Please select weight'); return; }
    }

    const directItem = {
      product: product,
      productId: product._id?.$oid || product._id,
      name: product.name,
      image: product.image,
      qty: quantity,
      price: isCakeWithVariants ? currentPrice : product.price,
      options: options,
      addons: selectedAddons,
      coupon: (product.coupon?.enabled && isCouponApplied) ? product.coupon : null
    };

    navigate('/checkout', { state: { directItem } });
  };

  const getFlavorImages = (flavor) => {
    if (!flavor || !flavor.images) return [];
    return flavor.images.filter(img => img && !img.startsWith('blob:'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 border-[6px] border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-base text-muted font-black uppercase tracking-widest">Preparing your treats...</p>
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
      <div className="bg-card border-b border-border block">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center flex-wrap gap-1.5 lg:gap-2 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.15em] lg:tracking-[0.2em] text-muted">
            <button onClick={() => navigate('/')} className="hover:text-primary transition">Home</button>
            <ChevronRight size={12} />
            {Array.isArray(product?.category) ? product.category.map((cat, i) => (
              <React.Fragment key={cat}>
                <button onClick={() => navigate(`/shop?category=${cat}`)} className="hover:text-primary transition capitalize">{cat}</button>
                {i < product.category.length - 1 && ', '}
              </React.Fragment>
            )) : (
              <button onClick={() => navigate(`/shop?category=${product?.category}`)} className="hover:text-primary transition capitalize">{product?.category}</button>
            )}
            <ChevronRight size={12} />
            <span className="text-heading truncate max-w-[200px]">{product?.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-4 lg:px-8 xl:px-12 lg:py-10">
        {/* ── TOP SECTION: Gallery + Pricing ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start mb-6">
          
          {/* ── LEFT — IMAGE SECTION ── */}
          {/* Note: Ensure inside your internal ProductGallery component, the root layout handles aspect-[9/16] or aspect-[3/4] using object-contain with background #e3cbb3 */}
          <div className="w-full space-y-4">
            <ProductGallery
              product={product}
              displayImage={displayImage}
              setDisplayImage={setDisplayImage}
              imgZoom={imgZoom}
              setImgZoom={setImgZoom}
              offerPct={offerPct}
              isWishlisted={isWishlisted}
              toggleWishlist={toggleWishlist}
              selectedFlavor={selectedFlavor}
              getFlavorImages={getFlavorImages}
            />
          </div>

          {/* ── RIGHT — DETAILS ── */}
          <div className="w-full lg:sticky lg:top-24 space-y-4 px-1 lg:px-0">
            <div className="bg-card rounded-[2rem] sm:rounded-[2.5rem] border border-border/50 p-5 sm:p-10 shadow-card hover:shadow-premium transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-black text-primary uppercase bg-primary/5 px-4 py-1.5 rounded-full tracking-widest border border-primary/10">
                  {productCategory}
                </span>
                <button className="p-2.5 text-muted hover:text-primary transition-colors bg-card-soft rounded-full border border-border/40 shadow-soft"><Share2 size={18} /></button>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-heading leading-[1.1] mb-4 capitalize tracking-tight">{productName}</h1>

              {String(productCategory || '').toLowerCase().includes('cake') && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <PureVegBadge className="px-3 py-2 rounded-full" />
                </div>
              )}

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1.5 bg-success text-button-text px-3 py-1 rounded-xl text-xs font-black shadow-sm">
                  {product?.ratingsAverage || 0} <Star size={12} fill="currentColor" />
                </div>
                <span className="text-xs text-muted font-black uppercase tracking-widest">{product?.ratingsCount || 0} verified ratings</span>
              </div>

              <ProductVariants
                product={product}
                selectedFlavor={selectedFlavor}
                handleFlavorChange={handleFlavorChange}
                showCustomFlavorInput={showCustomFlavorInput}
                setShowCustomFlavorInput={setShowCustomFlavorInput}
                customFlavor={customFlavor}
                setCustomFlavor={setCustomFlavor}
                handleCustomFlavorSubmit={handleCustomFlavorSubmit}
                selectedWeight={selectedWeight}
                handleWeightChange={handleWeightChange}
                showCustomWeightInput={showCustomWeightInput}
                setShowCustomWeightInput={setShowCustomWeightInput}
                customWeight={customWeight}
                setCustomWeight={setCustomWeight}
                handleCustomWeightSubmit={handleCustomWeightSubmit}
                isInStock={isInStock}
              />

              {availableAddons.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm sm:text-base font-black text-heading uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                    Frequently Bought Together (Add-ons)
                  </h3>
                  <div className="flex flex-col gap-3">
                    {availableAddons.map(addon => {
                      const isSelected = selectedAddons.some(a => a._id === addon._id);
                      const qty = selectedAddonQty(addon);
                      return (
                        <div
                          key={addon._id}
                          className={`flex items-center gap-4 p-3 sm:p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-primary/60 bg-primary/5 shadow-sm' : 'border-border/30 bg-card hover:border-primary/30'}`}
                        >
                          {/* Left: Addon Image */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-border/20 bg-white shrink-0">
                            <img src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
                          </div>

                          {/* Middle: Name & Price */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-black text-heading uppercase tracking-tight truncate">{addon.name}</p>
                            <p className="text-sm sm:text-base font-black text-primary mt-0.5">₹{addon.price} <span className="text-xs text-muted/50 font-bold lowercase">/ each</span></p>
                            {isSelected && (
                              <p className="text-xs text-success-text font-bold mt-1">
                                Total: ₹{addon.price * qty}
                              </p>
                            )}
                          </div>

                          {/* Right: Add / Qty Controls */}
                          <div className="shrink-0">
                            {isSelected ? (
                              <div className="flex items-center gap-0 bg-emerald-600 rounded-xl overflow-hidden shadow-md select-none" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => handleAddonDecrement(addon)} 
                                  className="px-3 py-2 text-white font-black text-base hover:bg-emerald-700 transition-colors"
                                >
                                  −
                                </button>
                                <span className="px-3 py-2 text-white font-black text-sm min-w-[36px] text-center bg-emerald-700">{qty}</span>
                                <button 
                                  onClick={() => handleAddonIncrement(addon)} 
                                  className="px-3 py-2 text-white font-black text-base hover:bg-emerald-700 transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddonToggle(addon)}
                                className="px-4 py-2 rounded-xl border-2 border-primary/30 text-primary font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-primary/10 transition-all"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <ProductPricing
                product={product}
                currentPrice={currentPrice + addonSum}
                finalPrice={finalPrice}
                offerDiscount={offerDiscount}
                totalSavingsPct={totalSavingsPct}
                couponSavings={couponSavings}
                isCouponApplied={isCouponApplied}
                applyingCoupon={applyingCoupon}
                handleApplyCoupon={handleApplyCoupon}
                handleRemoveCoupon={handleRemoveCoupon}
                addonSum={addonSum}
                selectedFlavor={selectedFlavor}
              />

              <ProductActionButtons
                productId={productId}
                cartQty={cartQty}
                isInStock={isInStock}
                addingToCart={addingToCart}
                handleUpdateQuantity={handleUpdateQuantity}
                handleAddToCart={handleAddToCart}
                handleBuyNow={handleBuyNow}
              />
            </div>
          </div>
        </div>

        {/* ── BOTTOM SECTION: 8/4 Grid Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left: Description + Reviews */}
          <div className="lg:col-span-8 space-y-12">
            <ProductDescription product={product} />
            <ProductReviews product={product} productReviews={productReviews} />
          </div>

          {/* Right: Related Products (Sticky Side Panel) - Desktop only */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 hidden lg:block h-full">
            <div className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm h-full">
              <ProductRelated relatedProducts={relatedProducts} />
            </div>
          </div>
        </div>

        {/* FULL WIDTH SIMILAR PRODUCTS SECTION (Desktop + Mobile) */}
        <div className="mt-16 px-4 lg:px-0">
          <ProductSimilar relatedProducts={relatedProducts} />
        </div>

        {/* MOBILE RELATED PRODUCTS (Fallback for mobile screens) */}
        <div className="block lg:hidden px-4 mb-8">
          <ProductRelated relatedProducts={relatedProducts} />
        </div>

        {/* MOBILE BOTTOM ACTION BAR */}
        <div className="block lg:hidden">
          <ProductActionButtons
            productId={productId}
            cartQty={cartQty}
            isInStock={isInStock}
            addingToCart={addingToCart}
            handleUpdateQuantity={handleUpdateQuantity}
            handleAddToCart={handleAddToCart}
            handleBuyNow={handleBuyNow}
            isMobile={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;