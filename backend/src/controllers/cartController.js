const cacheService = require('../services/cacheService');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

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

// Helper to calculate fresh prices for an item based on DB state
const getItemPriceDetails = (product, selectedFlavor = null, selectedWeight = null) => {
  // For cake products with variants
  let salePrice = product.offerPrice && product.offerPrice < product.price ? product.offerPrice : product.price;
  let variantPrice = null;
  
  const isCake = product.category && product.category.toLowerCase().includes('cake');
  const isBento = product.category && product.category.toLowerCase() === 'bento-cakes';

  // If this is a cake with variants and we have selected flavor/weight
  if (product.hasVariants && product.variants && product.variants.length > 0 && selectedFlavor && selectedWeight) {
    const variant = product.variants.find(
      v => v.flavor === selectedFlavor && v.weight === selectedWeight
    );
    if (variant) {
      variantPrice = variant.price;
      salePrice = variant.price;
    }
  } else if (isCake) {
    const weight = selectedWeight || (isBento ? '250g' : '500g');
    const multiplier = getWeightMultiplier(weight);
    salePrice = product.price * multiplier;
    variantPrice = salePrice;
  }
  
  let finalPrice = salePrice;
  let discountText = null;
  let couponAvailable = false;
  let activeCouponCode = null;

  // Validate coupon properly with all conditions
  if (product.coupon && product.coupon.enabled === true) {
    const now = new Date();
    const startDate = product.coupon.startDate ? new Date(product.coupon.startDate) : null;
    const endDate = product.coupon.endDate ? new Date(product.coupon.endDate) : null;
    const usageLimit = product.coupon.usageLimit;
    const usedCount = product.coupon.usedCount || 0;
    
    // Check all coupon conditions
    const isWithinDateRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);
    const isWithinUsageLimit = !usageLimit || usedCount < usageLimit;
    
    if (isWithinDateRange && isWithinUsageLimit) {
      couponAvailable = true;
      activeCouponCode = product.coupon.code;

      if (product.coupon.type === 'flat') {
        const discount = product.coupon.value;
        finalPrice = Math.max(0, salePrice - discount);
        discountText = `Save ₹${discount}`;
      } else if (product.coupon.type === 'percent') {
        const discount = (salePrice * product.coupon.value) / 100;
        finalPrice = Math.max(0, salePrice - Math.round(discount));
        discountText = `${product.coupon.value}% OFF`;
      } else if (product.coupon.type === 'price') {
        finalPrice = product.coupon.value;
        const saved = salePrice - product.coupon.value;
        discountText = `Save ₹${saved}`;
      }
    }
  }

  return {
    price: product.price,
    offerPrice: product.offerPrice,
    variantPrice,
    salePrice,
    finalPrice,
    discountText,
    couponAvailable,
    activeCouponCode
  };
};

// Internal helper to get/refresh cart with latest DB data
const refreshCart = async (userId) => {
  const cartKey = `cart:${userId}`;
  const cartData = await cacheService.get(cartKey);
  let cart = typeof cartData === 'string' ? JSON.parse(cartData) : (cartData || { items: [], total: 0 });

  let newTotal = 0;
  let originalTotal = 0;
  const updatedItems = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.productId);
    
    // Safety check: skip disabled or non-existent products
    if (product && product.isActive) {
      const details = getItemPriceDetails(product, item.selectedFlavor, item.selectedWeight);
      
      // ONLY APPLY DISCOUNT IF:
      // 1. The product has a coupon enabled and valid
      // 2. The code matches the cart's appliedCoupon (case-insensitive)
      const isApplied = cart.appliedCoupon && details.activeCouponCode &&
        details.activeCouponCode.toUpperCase() === cart.appliedCoupon.toUpperCase();

      // ✅ When coupon NOT applied → use salePrice (offerPrice if set, else MRP)
      // ✅ When coupon IS applied → use finalPrice (salePrice - coupon discount)
      const actualFinalPrice = isApplied ? details.finalPrice : details.salePrice;

      const updatedItem = {
        productId: item.productId,
        name: product.name,
        image: product.image,
        category: product.category,
        qty: item.qty,
        price: details.price,
        offerPrice: details.offerPrice,
        selectedFlavor: item.selectedFlavor || null,
        selectedWeight: item.selectedWeight || null,
        variantPrice: details.variantPrice,
        finalPrice: actualFinalPrice,
        discountText: isApplied ? details.discountText : null,
        couponAvailable: details.couponAvailable,
        activeCouponCode: details.activeCouponCode,
        // ✅ Send full coupon object so frontend can recalculate correctly
        coupon: product.coupon?.enabled ? {
          enabled: product.coupon.enabled,
          code: product.coupon.code,
          type: product.coupon.type,
          value: product.coupon.value,
          startDate: product.coupon.startDate,
          endDate: product.coupon.endDate,
          usageLimit: product.coupon.usageLimit,
          usedCount: product.coupon.usedCount
        } : null,
        subtotal: actualFinalPrice * item.qty,
        originalSubtotal: (details.variantPrice || details.price) * item.qty
      };
      
      updatedItems.push(updatedItem);
      newTotal += updatedItem.subtotal;
      originalTotal += updatedItem.originalSubtotal;
    }
  }

  const updatedCart = { 
    items: updatedItems, 
    total: newTotal, 
    originalTotal: originalTotal,
    appliedCoupon: cart.appliedCoupon 
  };
  
  // Sync back to Redis
  await cacheService.set(cartKey, updatedCart, 86400 * 7);
  return updatedCart;
};

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await refreshCart(req.user._id);
  res.status(200).json({ status: 'success', data: cart });
});

exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, qty = 1, selectedFlavor, selectedWeight } = req.body;
  const product = await Product.findById(productId);
  if (!product) return next(new AppError('Product not found', 404));

  // Validate selected flavor and weight if product has variants
  if (product.hasVariants && product.variants && product.variants.length > 0) {
    if (!selectedFlavor || !selectedWeight) {
      return next(new AppError('Please select flavor and weight for this cake', 400));
    }
    
    const variant = product.variants.find(
      v => v.flavor === selectedFlavor && v.weight === selectedWeight
    );
    
    if (!variant) {
      return next(new AppError('Selected flavor and weight combination not available', 400));
    }
    
    if (variant.stock !== undefined && variant.stock < qty) {
      return next(new AppError(`Only ${variant.stock} items available for this combination`, 400));
    }
  } else {
    // Regular product stock check
    if (product.stock < qty) {
      return next(new AppError(`Only ${product.stock} items available`, 400));
    }
  }

  const cartKey = `cart:${req.user._id}`;
  const cartData = await cacheService.get(cartKey);
  let cart = typeof cartData === 'string' ? JSON.parse(cartData) : (cartData || { items: [], total: 0 });

  // Check if item with same productId AND same flavor/weight combination exists
  const existingItemIndex = cart.items.findIndex(item => 
    item.productId.toString() === productId &&
    item.selectedFlavor === selectedFlavor &&
    item.selectedWeight === selectedWeight
  );
  
  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].qty += qty;
  } else {
    // Push with flavor/weight info
    cart.items.push({ productId, qty, selectedFlavor, selectedWeight });
  }

  await cacheService.set(cartKey, cart, 86400 * 7);
  const updatedCart = await refreshCart(req.user._id);
  res.status(200).json({ status: 'success', data: updatedCart });
});

exports.updateCart = asyncHandler(async (req, res) => {
  const { productId, qty, selectedFlavor, selectedWeight } = req.body;
  const cartKey = `cart:${req.user._id}`;
  const cartData = await cacheService.get(cartKey);
  let cart = typeof cartData === 'string' ? JSON.parse(cartData) : (cartData || { items: [], total: 0 });

  // Find item with matching productId AND flavor/weight combination
  const itemIndex = cart.items.findIndex(item => 
    item.productId.toString() === productId &&
    item.selectedFlavor === selectedFlavor &&
    item.selectedWeight === selectedWeight
  );
  
  if (itemIndex > -1) {
    if (qty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].qty = qty;
    }
  }

  await cacheService.set(cartKey, cart, 86400 * 7);
  const updatedCart = await refreshCart(req.user._id);
  res.status(200).json({ status: 'success', data: updatedCart });
});

exports.removeFromCart = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;
  // Support flavor/weight from body (for variant products)
  const selectedFlavor = req.body?.selectedFlavor || undefined;
  const selectedWeight = req.body?.selectedWeight || undefined;

  const cartKey = `cart:${req.user._id}`;
  const cartData = await cacheService.get(cartKey);
  let cart = typeof cartData === 'string' ? JSON.parse(cartData) : (cartData || { items: [], total: 0 });

  if (selectedFlavor && selectedWeight) {
    // Remove specific variant
    cart.items = cart.items.filter(item =>
      !(item.productId.toString() === productId &&
        item.selectedFlavor === selectedFlavor &&
        item.selectedWeight === selectedWeight)
    );
  } else {
    // Remove all items with this productId (non-variant products)
    cart.items = cart.items.filter(item =>
      item.productId.toString() !== productId
    );
  }

  await cacheService.set(cartKey, cart, 86400 * 7);
  const updatedCart = await refreshCart(req.user._id);
  res.status(200).json({ status: 'success', data: updatedCart });
});

exports.clearCart = asyncHandler(async (req, res) => {
  await cacheService.del(`cart:${req.user._id}`);
  res.status(200).json({ status: 'success', data: null });
});

exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  if (code == null || String(code).trim() === '') {
    return next(new AppError('Coupon code is required', 400));
  }
  const cartKey = `cart:${req.user._id}`;
  const cartData = await cacheService.get(cartKey);
  let cart = typeof cartData === 'string' ? JSON.parse(cartData) : (cartData || { items: [] });

  if (!cart.items || cart.items.length === 0) {
    return next(new AppError('Cart is empty', 400));
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const now = new Date();

  // Find product with matching coupon code (case-insensitive) and validate all conditions
  let validCouponProduct = null;
  let couponData = null;

  // Search through all products in cart to find one with valid coupon
  for (const item of cart.items) {
    const product = await Product.findById(item.productId);
    if (product && product.coupon && product.coupon.enabled === true) {
      if (product.coupon.code && product.coupon.code.toUpperCase() === normalizedCode) {
        const startDate = product.coupon.startDate ? new Date(product.coupon.startDate) : null;
        const endDate = product.coupon.endDate ? new Date(product.coupon.endDate) : null;
        const isWithinDateRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);
        
        const usageLimit = product.coupon.usageLimit;
        const usedCount = product.coupon.usedCount || 0;
        const isWithinUsageLimit = !usageLimit || usedCount < usageLimit;
        
        if (isWithinDateRange && isWithinUsageLimit) {
          validCouponProduct = product;
          couponData = product.coupon;
          break;
        }
      }
    }
  }

  // If not found in cart, search all products in database
  if (!validCouponProduct) {
    const productWithCoupon = await Product.findOne({
      'coupon.code': new RegExp(`^${normalizedCode}$`, 'i'),
      'coupon.enabled': true
    });

    if (productWithCoupon) {
      const startDate = productWithCoupon.coupon.startDate ? new Date(productWithCoupon.coupon.startDate) : null;
      const endDate = productWithCoupon.coupon.endDate ? new Date(productWithCoupon.coupon.endDate) : null;
      const isWithinDateRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);
      
      const usageLimit = productWithCoupon.coupon.usageLimit;
      const usedCount = productWithCoupon.coupon.usedCount || 0;
      const isWithinUsageLimit = !usageLimit || usedCount < usageLimit;
      
      if (isWithinDateRange && isWithinUsageLimit) {
        validCouponProduct = productWithCoupon;
        couponData = productWithCoupon.coupon;
      }
    }
  }

  if (!validCouponProduct || !couponData) {
    cart.appliedCoupon = null;
    await cacheService.set(cartKey, cart, 86400 * 7);
    return next(new AppError('Invalid or inactive coupon code', 400));
  }

  // Verify that the product with this coupon is actually in the cart for a specific warning
  // But we still allow applying it so it's ready when the product is added
  const couponProductInCart = cart.items.some(
    item => item.productId.toString() === validCouponProduct._id.toString()
  );

  let message = `Coupon ${couponData.code} applied successfully!`;
  if (!couponProductInCart) {
    message = `Coupon ${couponData.code} applied! Add the item to your cart to see the discount.`;
  }


  // Apply the coupon to cart
  cart.appliedCoupon = normalizedCode;
  await cacheService.set(cartKey, cart, 86400 * 7);

  const updatedCart = await refreshCart(req.user._id);
  res.status(200).json({ 
    status: 'success', 
    data: updatedCart,
    message
  });
});

exports.removeCoupon = asyncHandler(async (req, res) => {
  const cartKey = `cart:${req.user._id}`;
  const cartData = await cacheService.get(cartKey);
  let cart = typeof cartData === 'string' ? JSON.parse(cartData) : (cartData || { items: [] });

  cart.appliedCoupon = null;
  await cacheService.set(cartKey, cart, 86400 * 7);

  const updatedCart = await refreshCart(req.user._id);
  res.status(200).json({ status: 'success', data: updatedCart });
});