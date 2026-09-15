const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Addon = require('../models/Addon');
const cacheService = require('../services/cacheService');
const telegramService = require('../services/telegramService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

let ioInstance = null;
const setIo = (io) => {
  ioInstance = io;
};

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ Razorpay ENV missing');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const SHOP_LAT = Number(process.env.SHOP_LAT ?? 11.004540031168712);
const SHOP_LNG = Number(process.env.SHOP_LNG ?? 76.97510955713153);
const DELIVERY_MIN_FEE = Number(process.env.DELIVERY_MIN_FEE ?? 30);
const DELIVERY_PER_KM_RATE = Number(process.env.DELIVERY_PER_KM_RATE ?? 4);
const GST_RATE = 0.05;

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const validateQuantity = (qty) => {
  const num = Number(qty);
  if (!Number.isInteger(num) || num <= 0 || num > 100) {
    throw new AppError('Invalid quantity. Must be an integer between 1 and 100.', 400);
  }
  return num;
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
  throw new AppError(`Invalid weight selected: ${weightStr}`, 400);
};

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

const getFlavorPriceHelper = (flavor) => {
  if (!flavor) return 0;
  if (flavor.price && Number(flavor.price) > 0) return Number(flavor.price);
  if (flavor.name && BENTO_FLAVOR_PRICES[flavor.name]) return BENTO_FLAVOR_PRICES[flavor.name];
  if (typeof flavor === 'string' && BENTO_FLAVOR_PRICES[flavor]) return BENTO_FLAVOR_PRICES[flavor];
  return 0;
};



const computePricing = ({ cartItems, addressLat, addressLng, discount = 0, paymentMethod = 'ONLINE' }) => {
  const subtotal = cartItems.reduce((sum, item) => {
    const unitPrice = Number(item.finalPrice ?? item.price ?? 0);
    const qty = validateQuantity(item.qty);
    
    let itemTotal = unitPrice * qty;
    if (item.addons && Array.isArray(item.addons)) {
      item.addons.forEach(addon => {
        itemTotal += Number(addon.price || 0) * validateQuantity(addon.qty || 1) * qty;
      });
    }
    
    return sum + itemTotal;
  }, 0);

  let deliveryCharge = 0;
  if (paymentMethod !== 'WHATSAPP' && addressLat && addressLng) {
    const distance = calculateDistanceKm(SHOP_LAT, SHOP_LNG, addressLat, addressLng);
    deliveryCharge = Math.round(distance * 10);
  }
  
  const convenienceFee = Math.round(subtotal * 0.025);
  // Product prices are tax-inclusive. Store the GST component for reporting,
  // but never add it again to the customer-facing total.
  const gst = 'Inclusive on product price';
  const total = subtotal + deliveryCharge + convenienceFee - (Number(discount) || 0);
  
  return { subtotal, deliveryCharge, convenienceFee, gst, total };
};

const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${random}`;
};

const isValidObjectIdString = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ''));

const isCustomBuilderItem = (item) => {
  const catStr = Array.isArray(item?.category)
    ? item.category.join(' ').toLowerCase()
    : String(item?.category || '').toLowerCase();
  return (
    String(item?.productId || '').startsWith('custom-') ||
    catStr.includes('custom cakes') ||
    !!item?.options?.theme
  );
};

const getCustomBuilderObjectId = (item) => {
  const productId = String(item?.productId || '');
  const parts = productId.split('-');
  const objectIdPart = parts.find((part) => isValidObjectIdString(part));
  if (objectIdPart) return objectIdPart;
  return `CUSTOM_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
};

// -------------------- NEW: Database price calculation for custom cakes --------------------
/**
 * Compute the exact price of a custom cake using database values.
 * This ensures the backend is the source of truth, and the frontend doesn't need to send a price.
 */
const computeCustomCakePrice = async (options) => {
  try {
    // 1. Find the theme by name (options.theme)
    const Theme = require('../models/CustomCakeTheme'); // adjust path as needed
    const theme = await Theme.findOne({ name: options.theme, isActive: true });
    if (!theme) throw new Error(`Theme "${options.theme}" not found`);

    // 2. Determine tier (default 1)
    const tierNum = options.tier ? parseInt(options.tier.replace(/\D/g, ''), 10) || 1 : 1;
    const tierKey = `tier${tierNum}`;
    const tierPrice = theme.tiers?.[tierKey]?.price || 0;

    // 3. Find color (theme color) by name (options.color)
    const colorObj = theme.colors?.find(c => c.name === options.color && c.isActive);
    const colorPrice = colorObj?.price || 0;

    // 4. Find sponge flavor by name (options.flavor)
    const flavorObj = theme.flavors?.find(f => f.name === options.flavor && f.isActive);
    if (!flavorObj) throw new Error(`Flavor "${options.flavor}" not found for theme "${options.theme}"`);

    // 5. Get weight price (options.weight, e.g. "3 Kg")
    const weightKg = parseFloat(options.weight);
    const weightPriceObj = flavorObj.weights?.find(w => w.kg === weightKg);
    if (!weightPriceObj) throw new Error(`Weight "${options.weight}" not available for flavor "${options.flavor}"`);
    const weightPrice = weightPriceObj.price;

    const total = weightPrice + colorPrice + tierPrice;
    return total;
  } catch (err) {
    console.error('❌ computeCustomCakePrice error:', err.message);
    throw new AppError(`Unable to calculate custom cake price: ${err.message}`, 400);
  }
};

/**
 * Compute custom cake price from database.
 * Ignores any frontend price fields to prevent tampering.
 */
const getCustomCakePrice = async (item) => {
  const options = item.options || {};
  if (!options.theme || !options.flavor || !options.weight) {
    throw new AppError('Missing required custom cake options (theme, flavor, weight)', 400);
  }
  return await computeCustomCakePrice(options);
};

const buildCustomCakeDetails = (options = {}) => {
  const tierNum = options.tier ? parseInt(String(options.tier).replace(/\D/g, ''), 10) || 1 : 1;
  const photo = options.photoUrl || options.photo || options.photoReferenceUrl || '';
  return {
    tiers: tierNum,
    weight: options.weight || '1 kg',
    flavour: `${options.color || ''} (Flavour: ${options.flavor || ''})`,
    designTheme: options.theme || 'Custom Cake',
    messageOnCake: `Name: ${options.name || ''}, Age: ${options.age || ''}, Message: ${options.message || ''}`,
    notes: options.notes || '',
    photoReferenceUrl: photo,
    photoUrl: photo,
    photo: photo
  };
};

const buildCustomBuilderCartItem = async (item) => {
  const productId = getCustomBuilderObjectId(item);
  const options = item.options || {};
  const price = await getCustomCakePrice(item);   // now async
  const qty = validateQuantity(item.qty ?? item.quantity ?? 1);

  return {
    productId,
    name: item.name || `${options.flavor || 'Custom'} Cake`,
    qty,
    price,
    image: item.image,
    finalPrice: price,
    activeCouponCode: null,
    selectedFlavor: options.color || options.flavor || item.selectedFlavor,
    selectedWeight: options.weight || item.selectedWeight,
    isCustomCake: true,
    category: 'Custom Cakes',
    customDetails: buildCustomCakeDetails(options)
  };
};

const validateAddress = (address) => {
  if (!address) throw new Error('Address is required');
  if (!address.fullName?.trim()) throw new Error('Full name is required in address');
  if (!address.phone?.trim()) throw new Error('Phone number is required in address');
  let phoneDigits = address.phone.replace(/\D/g, '');
  if (phoneDigits.startsWith('91') && phoneDigits.length === 12) {
    phoneDigits = phoneDigits.slice(2);
  } else if (phoneDigits.startsWith('0') && phoneDigits.length === 11) {
    phoneDigits = phoneDigits.slice(1);
  }
  if (phoneDigits.length !== 10) throw new Error(`Phone number must be 10 digits (got ${phoneDigits.length} digits: ${phoneDigits})`);
  return true;
};

exports.createRazorpayOrder = asyncHandler(async (req, res) => {
  const { address, discount, couponCode, deliveryDate, deliverySlot, directItem, notes, cakeMessage, paymentMethod = 'ONLINE' } = req.body;

  if (!req.user?._id) throw new AppError('Unauthorized user', 401);
  const customer = await User.findById(req.user._id).select('phone phoneVerified provider');
  // Preserve existing email-verified local accounts created before this field
  // existed. Google accounts never receive this compatibility upgrade.
  if (customer?.provider === 'local' && customer.phone && customer.phoneVerified !== true) {
    customer.phoneVerified = true;
    await customer.save({ validateBeforeSave: false });
  }
  if (!customer?.phone || customer.phoneVerified !== true) {
    throw new AppError('Please verify your mobile number before placing an order.', 403);
  }
  try {
    validateAddress(address);
  } catch (err) {
    console.error('❌ Address validation failed:', err.message, 'Address payload:', address);
    throw new AppError(err.message, 400);
  }

  let normalizedSlot = deliverySlot;
  const slotMap = {
    'Morning (9-12)': 'Morning', 'Afternoon (12-4)': 'Afternoon', 'Evening (4-8)': 'Evening', 'Night (8-11)': 'Night',
    'Morning (9AM-12PM)': 'Morning', 'Afternoon (12PM-4PM)': 'Afternoon', 'Evening (4PM-8PM)': 'Evening', 'Night (8PM-11PM)': 'Night',
    '10am-1pm': '10am-1pm', '1pm-4pm': '1pm-4pm', '4pm-7pm': '4pm-7pm', '7pm-10pm': '7pm-10pm'
  };
  if (slotMap[deliverySlot]) normalizedSlot = slotMap[deliverySlot];

  let cart;

  // Securely resolve addons from DB
  const addonIdsToFetch = new Set();
  const processItemAddons = (item) => {
    if (item.addons && Array.isArray(item.addons)) {
      item.addons.forEach(a => {
        const id = a._id || a.addonId;
        if (id && isValidObjectIdString(id)) addonIdsToFetch.add(id);
      });
    }
  };

  if (directItem) {
    processItemAddons(directItem);
  } else if (req.body.items && Array.isArray(req.body.items)) {
    req.body.items.forEach(processItemAddons);
  }

  const addonMap = {};
  if (addonIdsToFetch.size > 0) {
    const addonsFromDb = await Addon.find({ _id: { $in: Array.from(addonIdsToFetch) }, isActive: true });
    addonsFromDb.forEach(addon => {
      addonMap[addon._id.toString()] = addon;
    });
  }

  const validateAndMapAddons = (itemAddons) => {
    if (!itemAddons || !Array.isArray(itemAddons)) return [];
    
    const seenIds = new Set();
    const uniqueAddons = [];
    
    for (const a of itemAddons) {
      const aId = a._id || a.addonId;
      
      if (seenIds.has(aId)) {
        throw new AppError('Duplicate addons are not allowed', 400);
      }
      seenIds.add(aId);
      
      const dbAddon = addonMap[aId];
      if (!dbAddon) throw new AppError('Invalid or inactive addon selected', 400);
      
      const aQty = validateQuantity(a.qty || 1);
      uniqueAddons.push({
        addonId: dbAddon._id,
        name: dbAddon.name,
        price: dbAddon.price,
        qty: aQty,
        image: dbAddon.image
      });
    }
    return uniqueAddons;
  };

  // Direct item (Buy Now)
  if (directItem) {
    if (isCustomBuilderItem(directItem)) {
      const customCartItem = await buildCustomBuilderCartItem(directItem);
      cart = { items: [customCartItem], total: customCartItem.finalPrice * customCartItem.qty };
    } else {
      // Normal product (unchanged)
      let dbProductId = directItem.productId;
      if (typeof dbProductId === 'string' && dbProductId.startsWith('custom-')) {
        const parts = dbProductId.split('-');
        dbProductId = parts[parts.length - 1];
      }
      const product = await Product.findById(dbProductId);
      if (!product || product.stock === false || product.isActive === false) {
        console.error('❌ Stock/Status validation failed for directItem product ID:', dbProductId);
        throw new AppError(`Stock error: ${product?.name || 'Item'} is out of stock or unavailable`, 400);
      }

      let isCustomCake = false;
      let customDetails = null;
      const categoryStr = Array.isArray(product.category)
        ? product.category.join(' ').toLowerCase()
        : String(product.category || '').toLowerCase();
      if (categoryStr.includes('custom cakes') || (directItem.options && directItem.options.theme)) {
        isCustomCake = true;
        const tierNum = directItem.options.tier ? parseInt(directItem.options.tier.replace(/\D/g, '')) || 1 : 1;
        const photoDirect = directItem.options.photoUrl || directItem.options.photo || directItem.options.photoReferenceUrl || '';
        customDetails = {
          shape: 'round', tiers: tierNum, weight: directItem.options.weight || '1 kg',
          flavour: `${directItem.options.color || ''} (Flavour: ${directItem.options.flavor || ''})`,
          designTheme: directItem.options.theme || 'Teddy Theme',
          messageOnCake: `Name: ${directItem.options.name || ''}, Age: ${directItem.options.age || ''}, Message: ${directItem.options.message || ''}`,
          notes: directItem.options.notes || '',
          photoReferenceUrl: photoDirect,
          photoUrl: photoDirect,
          photo: photoDirect
        };
      }

      let salePrice = product.offerPrice && product.offerPrice < product.price ? product.offerPrice : product.price;
      const isCake = categoryStr.includes('cake');
      const isBento = categoryStr.includes('bento');
      const customWeightMatch = (product.hasCustomWeights || (product.customWeightPrices && product.customWeightPrices.length > 0)) && (directItem.selectedWeight || directItem.options?.weight)
        ? product.customWeightPrices?.find(c => String(c.weight).toLowerCase().trim() === String(directItem.selectedWeight || directItem.options?.weight).toLowerCase().trim())
        : null;

      let defaultFlavorPriceDirect = 0;
      if (!product.hasVariants && product.flavors && Array.isArray(product.flavors) && product.flavors.length > 0) {
        const selFlavorName = directItem.selectedFlavor || (directItem.options && (directItem.options.color || directItem.options.flavor));
        const foundFlavor = product.flavors.find(f => f.name === selFlavorName) || product.flavors[0];
        defaultFlavorPriceDirect = getFlavorPriceHelper(foundFlavor);
      }

      if (customWeightMatch && customWeightMatch.price !== undefined && customWeightMatch.price !== null) {
        salePrice = Number(customWeightMatch.price) + defaultFlavorPriceDirect;
      } else if (isCake && !isCustomCake) {
        const selectedWeight = directItem.selectedWeight || (directItem.options && directItem.options.weight) || (isBento ? '250g' : '500g');
        const multiplier = getWeightMultiplier(selectedWeight);
        salePrice = (product.price * multiplier) + defaultFlavorPriceDirect;
      } else if (product.hasVariants && product.variants && (directItem.selectedFlavor || directItem.options?.flavor) && (directItem.selectedWeight || directItem.options?.weight)) {
        const selFlavor = directItem.selectedFlavor || directItem.options?.flavor;
        const selWeight = directItem.selectedWeight || directItem.options?.weight;
        const variant = product.variants.find(v => v.flavor === selFlavor && v.weight === selWeight);
        if (variant) salePrice = variant.price;
        if (variant && variant.stock === false)
          throw new AppError(`Stock error: Selected combination is out of stock`, 400);
      }

      // Completely ignore payloadPriceDirect as DB price is the sole source of truth

      let finalPrice = salePrice;
      let activeCouponCode = null;
      if (directItem.appliedCoupon && product.coupon?.enabled && product.coupon.code.toUpperCase() === directItem.appliedCoupon.toUpperCase()) {
        const now = new Date();
        const startDate = product.coupon.startDate ? new Date(product.coupon.startDate) : null;
        const endDate = product.coupon.endDate ? new Date(product.coupon.endDate) : null;
        const isWithinDateRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);
        const isWithinUsageLimit = !product.coupon.usageLimit || (product.coupon.usedCount || 0) < product.coupon.usageLimit;
        if (isWithinDateRange && isWithinUsageLimit) {
          activeCouponCode = product.coupon.code;
          if (product.coupon.type === 'flat') finalPrice = Math.max(0, salePrice - product.coupon.value);
          else if (product.coupon.type === 'percent') finalPrice = Math.max(0, salePrice - Math.round((salePrice * product.coupon.value) / 100));
          else if (product.coupon.type === 'price') finalPrice = product.coupon.value;
        }
      }

      const validatedQty = validateQuantity(directItem.qty);
      const safeAddons = validateAndMapAddons(directItem.addons);
      const addonSum = safeAddons.reduce((sum, a) => sum + (a.price * a.qty), 0);

      cart = {
        items: [{
          productId: product._id, name: product.name, qty: validatedQty, price: product.price, image: product.image,
          finalPrice, activeCouponCode, selectedFlavor: directItem.selectedFlavor || (directItem.options && (directItem.options.color || directItem.options.flavor)),
          selectedWeight: directItem.selectedWeight || (directItem.options && directItem.options.weight), isCustomCake, customDetails,
          cakeMessage: (directItem.cakeMessage || directItem.options?.cakeMessage || '') ? String(directItem.cakeMessage || directItem.options?.cakeMessage).trim() : undefined,
          category: product.category, addons: safeAddons
        }],
        total: (finalPrice * validatedQty) + (addonSum * validatedQty)
      };
    }
  } else {
    // Cart items from Redux
    if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
      const validatedItems = [];
      let total = 0;

      // Optimize: Fetch all products in one go to prevent sequential DB queries
      const productIdsToFetch = req.body.items
        .filter(item => !isCustomBuilderItem(item))
        .map(item => {
          let dbId = item.productId;
          if (typeof dbId === 'string' && dbId.startsWith('custom-')) return dbId.split('-').pop();
          return dbId;
        })
        .filter(id => id && /^[0-9a-fA-F]{24}$/.test(String(id)));

      const productsList = await Product.find({ _id: { $in: productIdsToFetch } });
      const productMap = {};
      productsList.forEach(p => productMap[p._id.toString()] = p);

      for (const item of req.body.items) {
        if (isCustomBuilderItem(item)) {
          const customCartItem = await buildCustomBuilderCartItem(item);
          validatedItems.push(customCartItem);
          total += customCartItem.finalPrice * customCartItem.qty;
          continue;
        }
        // Normal product processing
        let dbProductId = item.productId;
        if (typeof dbProductId === 'string' && dbProductId.startsWith('custom-')) {
          const parts = dbProductId.split('-');
          dbProductId = parts[parts.length - 1];
        }
        const product = productMap[dbProductId];
        if (!product || product.stock === false || product.isActive === false) {
          console.error('❌ Stock/Status validation failed for cart item product ID:', dbProductId);
          throw new AppError(`Stock error: ${product?.name || 'Item'} is out of stock or unavailable`, 400);
        }

        let isCustomCake = false;
        let customDetails = null;
        const categoryStr = Array.isArray(product.category)
          ? product.category.join(' ').toLowerCase()
          : String(product.category || '').toLowerCase();
        if (categoryStr.includes('custom cakes') || (item.options && item.options.theme)) {
          isCustomCake = true;
          const tierNum = item.options.tier ? parseInt(item.options.tier.replace(/\D/g, '')) || 1 : 1;
          const photoCart = item.options.photoUrl || item.options.photo || item.options.photoReferenceUrl || '';
          customDetails = {
            shape: 'round', tiers: tierNum, weight: item.options.weight || '1 kg',
            flavour: `${item.options.color || ''} (Flavour: ${item.options.flavor || ''})`,
            designTheme: item.options.theme || 'Teddy Theme',
            messageOnCake: `Name: ${item.options.name || ''}, Age: ${item.options.age || ''}, Message: ${item.options.message || ''}`,
            notes: item.options.notes || '',
            photoReferenceUrl: photoCart,
            photoUrl: photoCart,
            photo: photoCart
          };
        }

        let salePrice = product.offerPrice && product.offerPrice < product.price ? product.offerPrice : product.price;
        const isCake = categoryStr.includes('cake');
        const isBento = categoryStr.includes('bento');
        const customWeightMatch = (product.hasCustomWeights || (product.customWeightPrices && product.customWeightPrices.length > 0)) && (item.options?.weight || item.selectedWeight)
          ? product.customWeightPrices?.find(c => String(c.weight).toLowerCase().trim() === String(item.options?.weight || item.selectedWeight).toLowerCase().trim())
          : null;

        let defaultFlavorPriceCart = 0;
        if (!product.hasVariants && product.flavors && Array.isArray(product.flavors) && product.flavors.length > 0) {
          const selFlavorName = item.options?.color || item.options?.flavor || item.selectedFlavor;
          const foundFlavor = product.flavors.find(f => f.name === selFlavorName) || product.flavors[0];
          defaultFlavorPriceCart = getFlavorPriceHelper(foundFlavor);
        }

        if (customWeightMatch && customWeightMatch.price !== undefined && customWeightMatch.price !== null) {
          salePrice = Number(customWeightMatch.price) + defaultFlavorPriceCart;
        } else if (isCake && !isCustomCake) {
          const selectedWeight = item.options?.weight || item.selectedWeight || (isBento ? '250g' : '500g');
          const multiplier = getWeightMultiplier(selectedWeight);
          salePrice = (product.price * multiplier) + defaultFlavorPriceCart;
        } else if (product.hasVariants && product.variants && (item.options?.flavor || item.selectedFlavor) && (item.options?.weight || item.selectedWeight)) {
          const selFlavor = item.options?.flavor || item.selectedFlavor;
          const selWeight = item.options?.weight || item.selectedWeight;
          const variant = product.variants.find(v => v.flavor === selFlavor && v.weight === selWeight);
          if (variant) salePrice = variant.price;
        }

        // Completely ignore payloadPriceCart as DB price is the sole source of truth

        let finalPrice = salePrice;
        let activeCouponCode = null;
        if (product.coupon?.enabled && couponCode && product.coupon.code.toUpperCase() === String(couponCode).toUpperCase()) {
          const now = new Date();
          const startDate = product.coupon.startDate ? new Date(product.coupon.startDate) : null;
          const endDate = product.coupon.endDate ? new Date(product.coupon.endDate) : null;
          const isWithinDateRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);
          const isWithinUsageLimit = !product.coupon.usageLimit || (product.coupon.usedCount || 0) < product.coupon.usageLimit;
          if (isWithinDateRange && isWithinUsageLimit) {
            activeCouponCode = product.coupon.code;
            if (product.coupon.type === 'flat') finalPrice = Math.max(0, salePrice - product.coupon.value);
            else if (product.coupon.type === 'percent') finalPrice = Math.max(0, salePrice - Math.round((salePrice * product.coupon.value) / 100));
            else if (product.coupon.type === 'price') finalPrice = product.coupon.value;
          }
        }

        const validatedQty = validateQuantity(item.qty);
        const safeAddons = validateAndMapAddons(item.addons);
        const addonSum = safeAddons.reduce((sum, a) => sum + (a.price * a.qty), 0);

        validatedItems.push({
          productId: product._id, name: product.name, qty: validatedQty, price: product.price, image: product.image,
          finalPrice, activeCouponCode, selectedFlavor: item.options?.color || item.options?.flavor || item.selectedFlavor,
          selectedWeight: item.options?.weight || item.selectedWeight, isCustomCake, customDetails,
          cakeMessage: (item.cakeMessage || item.options?.cakeMessage || '') ? String(item.cakeMessage || item.options?.cakeMessage).trim() : undefined,
          category: product.category, addons: safeAddons
        });
        
        total += (finalPrice + addonSum) * validatedQty;
      }
      cart = { items: validatedItems, total };
    } else {
      // Fallback to cached cart
      const cartKey = `cart:${req.user._id}`;
      const cartData = await cacheService.get(cartKey);
      if (!cartData) {
        console.error('❌ Cart is empty (no cache data found for user):', req.user._id);
        throw new AppError('Cart is empty', 400);
      }
      cart = typeof cartData === 'string' ? JSON.parse(cartData) : cartData;
    }
  }

  if (!cart.items?.length) {
    console.error('❌ Cart items array is empty or undefined:', cart);
    throw new AppError('Cart is empty', 400);
  }

  // Stock validation (skip custom cakes)
  if (!directItem) {
    const productIdsToValidate = cart.items
      .filter(item => !item.isCustomCake && (!item.productId || !String(item.productId).startsWith('CUSTOM_')))
      .map(item => {
        let dbId = item.productId;
        if (typeof dbId === 'string' && dbId.startsWith('custom-')) return dbId.split('-').pop();
        return dbId;
      })
      .filter(id => id && /^[0-9a-fA-F]{24}$/.test(String(id)));

    const productsForValidation = await Product.find({ _id: { $in: productIdsToValidate } });
    const validationMap = {};
    productsForValidation.forEach(p => validationMap[p._id.toString()] = p);

    for (const item of cart.items) {
      if (item.isCustomCake) continue;
      let dbProductId = item.productId;
      if (typeof dbProductId === 'string' && dbProductId.startsWith('CUSTOM_')) continue;
      if (typeof dbProductId === 'string' && dbProductId.startsWith('custom-')) {
        const parts = dbProductId.split('-');
        dbProductId = parts[parts.length - 1];
      }
      if (!dbProductId || !/^[0-9a-fA-F]{24}$/.test(String(dbProductId))) continue;
      
      const product = validationMap[dbProductId.toString()];
      if (!product || product.stock === false || product.isActive === false) {
        console.error('❌ Stock/Status validation failed for product ID:', dbProductId);
        throw new AppError(`Stock error: ${product?.name || 'Item'} is currently out of stock or unavailable`, 400);
      }
    }
  }

  const { subtotal, deliveryCharge, convenienceFee, gst, total } = computePricing({
    cartItems: cart.items,
    addressLat: Number(address?.lat),
    addressLng: Number(address?.lng),
    discount: 0,
    paymentMethod,
  });

  // Duplicate order prevention (only reuse if pricing matches)
  const existingPendingOrder = await Order.findOne({
    userId: req.user._id,
    paymentStatus: 'pending',
    orderStatus: paymentMethod === 'ONLINE' ? 'awaiting_payment' : 'confirmed',
    createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }
  });
  if (existingPendingOrder?.razorpayOrderId && existingPendingOrder.total === total) {
    return res.status(200).json({
      status: 'success',
      data: {
        razorpayOrder: { id: existingPendingOrder.razorpayOrderId, amount: existingPendingOrder.total * 100 },
        orderId: existingPendingOrder._id,
        pricing: {
          subtotal: existingPendingOrder.subtotal,
          deliveryCharge: existingPendingOrder.deliveryCharge,
          convenienceFee: existingPendingOrder.convenienceFee,
          gst: existingPendingOrder.gst,
          total: existingPendingOrder.total
        }
      }
    });
  }

  if (paymentMethod === 'ONLINE' && subtotal < 300) {
    throw new AppError('Orders below ₹300 are not eligible for delivery. Please increase your cart value for delivery, or proceed as a Shop Pickup Order.', 400);
  }

  let razorpayOrder = null;
  if (paymentMethod === 'ONLINE') {
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(total * 100),
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1
      });
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      const errMsg = error.message || error.description || JSON.stringify(error);
      throw new AppError(`Failed to create Razorpay order: ${errMsg}`, 500);
    }
  }

  const order = await Order.create({
    userId: req.user._id,
    items: cart.items.map(item => ({
      productId: item.productId,
      name: item.name,
      qty: item.qty,
      price: item.finalPrice ?? item.price ?? 0,
      originalPrice: item.price ?? 0,
      image: item.image,
      couponCode: item.activeCouponCode,
      selectedFlavor: item.selectedFlavor,
      selectedWeight: item.selectedWeight,
      category: Array.isArray(item.category) ? item.category.join(', ') : String(item.category || ''),
      discountAmount: ((item.price ?? 0) - (item.finalPrice ?? item.price ?? 0)) * item.qty,
      cakeMessage: item.cakeMessage || undefined,
      isCustomCake: item.isCustomCake || false,
      customDetails: item.customDetails || null,
      addons: item.addons ? item.addons.map(a => ({
        addonId: a._id || a.addonId,
        name: a.name,
        price: a.price,
        qty: a.qty || 1,
        image: a.image
      })) : []
    })),
    subtotal,
    deliveryCharge,
    convenienceFee,
    gst,
    total,
    discount: 0,
    paymentMethod,
    paymentStatus: 'pending',
    orderStatus: paymentMethod === 'ONLINE' ? 'awaiting_payment' : 'confirmed',
    address: {
      fullName: address.fullName?.trim(),
      phone: address.phone?.trim(),
      houseNo: address.houseNo?.trim() || '',
      street: address.street?.trim() || '',
      landmark: address.landmark?.trim() || '',
      city: address.city?.trim() || 'Coimbatore',
      pincode: address.pincode?.trim() || '641001',
      lat: address.lat ?? null,
      lng: address.lng ?? null
    },
    deliveryDate: deliveryDate || new Date(),
    deliverySlot: normalizedSlot,
    notes: typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
    cakeMessage: typeof cakeMessage === 'string' && cakeMessage.trim() ? cakeMessage.trim().slice(0, 500) : undefined,
    razorpayOrderId: razorpayOrder ? razorpayOrder.id : undefined,
    paymentAttemptAt: new Date()
  });

  if (razorpayOrder) {
    await Payment.create({ orderId: order._id, razorpayOrderId: razorpayOrder.id, amount: total, status: 'created' });
  }

  if (paymentMethod !== 'ONLINE') {
    const notificationManager = require('../services/notificationManager');
    await notificationManager.notifyOrderSuccess(order);
  }

  res.status(200).json({
    status: 'success',
    data: { razorpayOrder, orderId: order._id, orderNumber: order.orderNumber, pricing: { subtotal, deliveryCharge, convenienceFee, gst, total } }
  });
});

const reconcilePaidOrder = async ({ order, razorpayPaymentId, razorpaySignature = null }) => {
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $ne: 'paid' } },
    { $set: { paymentStatus: 'paid', orderStatus: 'confirmed', razorpayPaymentId, ...(razorpaySignature ? { razorpaySignature } : {}) } },
    { returnDocument: 'after' }
  );
  const finalOrder = updatedOrder || await Order.findById(order._id);
  await Payment.findOneAndUpdate(
    { orderId: order._id },
    { $set: { razorpayPaymentId, ...(razorpaySignature ? { razorpaySignature } : {}), status: 'paid' } }
  );

  if (updatedOrder) {
    await cacheService.del(`cart:${order.userId?._id || order.userId}`);
    try {
      const notificationManager = require('../services/notificationManager');
      for (const item of order.items || []) {
        if (item.isCustomCake) continue;
        const product = await Product.findById(item.productId);
        if (ioInstance) {
          const socketData = { productId: item.productId, newStock: product ? product.stock : 0 };
          if (product?.hasVariants && item.selectedFlavor && item.selectedWeight) {
            const variant = product.variants.find(
              (candidate) => candidate.flavor === item.selectedFlavor && candidate.weight === item.selectedWeight
            );
            if (variant) {
              socketData.variantUpdate = {
                flavor: item.selectedFlavor,
                weight: item.selectedWeight,
                newVariantStock: variant.stock,
              };
            }
          }
          ioInstance.emit('stock_updated', socketData);
        }
        if (product?.stock === false && notificationManager?.notifyOutOfStockAlert) {
          notificationManager.notifyOutOfStockAlert(product.name).catch((err) => console.error(err));
        }
      }
      notificationManager.notifyOrderSuccess(await finalOrder.populate('userId')).catch(err => console.error(err));
    } catch (err) {
      console.error('Failed to load notification manager:', err);
    }
  }
  return finalOrder;
};

exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    throw new AppError('Missing payment verification fields', 400);

  const existingOrder = await Order.findOne({ _id: orderId, userId: req.user._id });
  if (!existingOrder) {
    throw new AppError('Order not found or unauthorized', 404);
  }

  if (existingOrder.paymentStatus === 'paid') {
    return res.status(200).json({ status: 'success', message: 'Order already verified', data: existingOrder });
  }

  if (existingOrder.razorpayOrderId !== razorpay_order_id) {
    throw new AppError('Invalid order ID for payment verification', 400);
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
  if (expectedSignature !== razorpay_signature) {
    await Payment.findOneAndUpdate(
      { orderId }, 
      { $push: { failedAttempts: { errorDescription: 'Invalid signature', failedAt: new Date() } } }
    );
    throw new AppError('Payment verification failed', 400);
  }

  const order = await Order.findById(orderId).populate('userId');
  if (!order) throw new AppError('Order not found', 404);

  const reconciledOrder = await reconcilePaidOrder({
    order,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature
  });

  res.status(200).json({ status: 'success', data: reconciledOrder });
});

exports.handlePaymentFailure = asyncHandler(async (req, res) => {
  const { orderId, reason, errorDetails } = req.body;
  if (orderId) {
    const order = await Order.findOne({ _id: orderId, userId: req.user._id, paymentStatus: { $ne: 'paid' } });
    if (order) {
      const attemptData = {
        errorDescription: reason || 'Payment failed',
        errorCode: errorDetails?.code,
        errorReason: errorDetails?.reason,
        errorSource: errorDetails?.source,
        errorStep: errorDetails?.step,
        failedAt: new Date()
      };
      await Payment.findOneAndUpdate(
        { orderId }, 
        { $push: { failedAttempts: attemptData } }
      );
      try {
        const notificationManager = require('../services/notificationManager');
        if (notificationManager?.notifyPaymentFailure) notificationManager.notifyPaymentFailure(order, reason).catch(err => console.error(err));
      } catch (err) { console.error('Failed to load notification manager:', err); }
    }
  }
  res.status(200).json({ status: 'success' });
});

exports.getPaymentStatus = asyncHandler(async (req, res) => {
  const query = req.user.role === 'admin'
    ? { _id: req.params.orderId }
    : { _id: req.params.orderId, userId: req.user._id };
  const order = await Order.findOne(query);
  if (!order) throw new AppError('Order not found', 404);
  res.status(200).json({ status: 'success', paymentStatus: order.paymentStatus, orderId: order._id });
});

exports.handleWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  if (!secret || !signature || !req.rawBody) {
    return res.status(400).send('Webhook signature is required');
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  const isValidSignature = expectedSignature.length === signature.length
    && crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  if (!isValidSignature) return res.status(400).send('Invalid signature');

  const event = req.body?.event;
  const paymentEntity = req.body?.payload?.payment?.entity;
  const orderEntity = req.body?.payload?.order?.entity;
  const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
  const razorpayPaymentId = paymentEntity?.id;

  if (['payment.captured', 'order.paid'].includes(event) && razorpayOrderId) {
    const order = await Order.findOne({ razorpayOrderId });
    if (order) await reconcilePaidOrder({ order, razorpayPaymentId });
  }

  if (event === 'payment.failed' && razorpayOrderId) {
    const order = await Order.findOne({ razorpayOrderId, paymentStatus: { $ne: 'paid' } });
    if (order) {
      const attemptData = {
        razorpayPaymentId: paymentEntity?.id,
        errorCode: paymentEntity?.error_code,
        errorDescription: paymentEntity?.error_description,
        errorReason: paymentEntity?.error_reason,
        errorSource: paymentEntity?.error_source,
        errorStep: paymentEntity?.error_step,
        paymentMethod: paymentEntity?.method,
        failedAt: new Date()
      };
      await Payment.findOneAndUpdate(
        { orderId: order._id },
        { $push: { failedAttempts: attemptData } }
      );
    }
  }

  console.log('Webhook received:', req.body?.event || 'Unknown event');
  res.status(200).send('OK');
});

module.exports.setIo = setIo;
