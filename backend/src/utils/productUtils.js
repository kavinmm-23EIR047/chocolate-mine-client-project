'use strict';

/**
 * Resolves the true, canonical weight for a product item.
 * Prevents erroneous weights (such as 500g default) from being applied
 * to products with custom weights (e.g., Mini Cakes which are 130g, Bento cakes 250g, Tres leches 200g/600g).
 *
 * @param {Object} product - Product document or lean object from database
 * @param {string} requestedWeight - Weight requested by client (may be null/undefined or erroneous like '500g')
 * @param {number} [price] - Item price (used for disambiguation if multiple weights exist)
 * @returns {string|null} Resolved weight string (e.g. '130g', '250g', '500g', '1kg') or null
 */
const resolveProductWeight = (product, requestedWeight, price = null) => {
  if (!product) {
    return requestedWeight || null;
  }

  const cleanReq = requestedWeight ? String(requestedWeight).toLowerCase().trim() : null;
  const categoryStr = Array.isArray(product.category)
    ? product.category.join(' ').toLowerCase()
    : String(product.category || '').toLowerCase();
  const nameStr = String(product.name || '').toLowerCase();
  const isMiniCake = categoryStr.includes('mini') || nameStr.includes('mini');
  const isBento = categoryStr.includes('bento') || String(product.cakeType || '').toLowerCase().includes('bento');
  const isCake = categoryStr.includes('cake') || !!product.cakeType || isMiniCake || isBento;

  const hasCustomWeights = Boolean(
    product.hasCustomWeights ||
    (Array.isArray(product.customWeightPrices) && product.customWeightPrices.length > 0)
  );
  const customWeights = Array.isArray(product.customWeightPrices) ? product.customWeightPrices : [];

  // 1. If product has custom weights defined (e.g. Mini Cakes: 130g, Bento: 250g, Tres Leches: 200g/600g)
  if (hasCustomWeights && customWeights.length > 0) {
    // If requested weight matches one of the custom weights, use it
    if (cleanReq) {
      const match = customWeights.find(
        c => String(c.weight).toLowerCase().trim() === cleanReq
      );
      if (match) return match.weight;
    }

    // If product has standard weights specifically enabled (product.hasWeights === true)
    // AND the requested weight is a recognized standard weight, allow it.
    if (
      product.hasWeights === true &&
      cleanReq &&
      ['250g', '500g', '1kg', '1.5kg', '2kg', '2.5kg', '3kg'].includes(cleanReq.replace(/\s+/g, ''))
    ) {
      return requestedWeight;
    }

    // Otherwise standard weights are NOT supported for this product.
    // Try matching by price if available
    if (price !== null && price !== undefined) {
      const priceMatch = customWeights.find(c => Number(c.price) === Number(price));
      if (priceMatch) return priceMatch.weight;
    }

    // If it's a mini cake and custom weight exists, return first custom weight or 130g
    if (isMiniCake) {
      return customWeights[0]?.weight || '130g';
    }

    // Fall back to first custom weight
    if (customWeights[0]?.weight) {
      return customWeights[0].weight;
    }
  }

  // 2. Product with variants (flavor + weight combinations)
  if (product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0) {
    if (cleanReq) {
      const variantMatch = product.variants.find(
        v => String(v.weight).toLowerCase().trim() === cleanReq
      );
      if (variantMatch) return variantMatch.weight;
    }
    if (price !== null && price !== undefined) {
      const priceVariant = product.variants.find(v => Number(v.price) === Number(price));
      if (priceVariant) return priceVariant.weight;
    }
    if (product.variants[0]?.weight) {
      return product.variants[0].weight;
    }
  }

  // 3. Mini Cake special check (all mini cakes in catalog are 130g)
  if (isMiniCake) {
    return '130g';
  }

  // 4. Bento Cake special check (bento cakes are 250g)
  if (isBento) {
    return cleanReq && (cleanReq.includes('250g') || cleanReq.includes('0.25kg')) ? requestedWeight : '250g';
  }

  // 5. Standard Cakes
  if (isCake) {
    if (product.hasWeights === false && (!product.weights || product.weights.length === 0)) {
      return requestedWeight || null;
    }
    return requestedWeight || '500g';
  }

  // 6. Non-cake products (accessories, candles, merchandise, etc.)
  return requestedWeight || null;
};

module.exports = {
  resolveProductWeight
};
