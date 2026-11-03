const { resolveProductWeight } = require('../utils/productUtils');

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

const getItemPriceDetails = (product, selectedFlavor = null, selectedWeight = null) => {
  // For cake products with variants
  let salePrice = product.offerPrice && product.offerPrice < product.price ? product.offerPrice : product.price;
  let variantPrice = null;
  
  const categoryStr = Array.isArray(product.category)
    ? product.category.join(' ').toLowerCase()
    : String(product.category || '').toLowerCase();
  const isMiniCake = categoryStr.includes('mini') || String(product.name || '').toLowerCase().includes('mini');
  const isCake = categoryStr.includes('cake') || isMiniCake;
  const isBento = categoryStr.includes('bento-cakes') || categoryStr.includes('bento');

  const resolvedWeight = resolveProductWeight(product, selectedWeight, salePrice);

  // Check if product has custom weight prices defined
  const customWeightMatch = (product.hasCustomWeights || (product.customWeightPrices && product.customWeightPrices.length > 0)) && resolvedWeight
    ? product.customWeightPrices?.find(c => String(c.weight).toLowerCase().trim() === String(resolvedWeight).toLowerCase().trim())
    : null;

  // If this is a cake with variants and we have selected flavor/weight
  if (customWeightMatch && customWeightMatch.price !== undefined && customWeightMatch.price !== null) {
    salePrice = Number(customWeightMatch.price);
    variantPrice = salePrice;
  } else if (product.hasVariants && product.variants && product.variants.length > 0 && selectedFlavor && resolvedWeight) {
    const variant = product.variants.find(
      v => v.flavor === selectedFlavor && v.weight === resolvedWeight
    );
    if (variant) {
      variantPrice = variant.price;
      salePrice = variant.price;
    }
  } else if (isCake) {
    const weight = resolvedWeight || (isBento ? '250g' : (isMiniCake ? '130g' : '500g'));
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

module.exports = {
  getWeightMultiplier,
  getItemPriceDetails
};
