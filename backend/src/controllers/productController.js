const mongoose = require('mongoose');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('slugify');
const cloudinaryService = require('../services/cloudinaryService');
const notificationManager = require('../services/notificationManager');

const DEFAULT_CAKE_IMAGE_URL = 'https://via.placeholder.com/800x600.png?text=Chocolate+Mine+Cake+Background';

// Helper function to safely normalize boolean values from FormData
const normalizeBoolean = (value) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  // Handle array case (if multiple values were sent)
  if (Array.isArray(value)) {
    return value[0] === 'true' || value[0] === true;
  }
  return false; // default value
};

const applyCoupon = (product) => {
  if (!product.coupon || !product.coupon.enabled) return null;
  const now = new Date();
  const { startDate, endDate, usageLimit, usedCount, type, value, code } = product.coupon;
  
  // Check date range
  if (startDate && now < new Date(startDate)) return null;
  if (endDate && now > new Date(endDate)) return null;
  
  // Check usage limit
  if (usageLimit && usedCount >= usageLimit) return null;

  let finalPrice = product.price;
  let saved = 0;
  if (type === 'flat') {
    finalPrice = Math.max(0, product.price - value);
    saved = value;
  } else if (type === 'price') {
    finalPrice = value;
    saved = product.price - value;
  } else if (type === 'percent') {
    saved = (product.price * value) / 100;
    finalPrice = Math.max(0, product.price - saved);
  }
  return { code, finalPrice, saved, discountText: type === 'percent' ? `${value}% OFF` : `Save ₹${saved}` };
};

exports.getProducts = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    sort, 
    featured, 
    bestseller, 
    category, 
    cakeType,
    location, 
    occasion,
    rating,
    minPrice,
    maxPrice,
    q
  } = req.query;

  let query = { isActive: true };

  if (featured) query.featured = featured === 'true';
  if (bestseller) query.bestseller = bestseller === 'true';
  if (category) query.category = category;
  if (cakeType) query.cakeType = cakeType;
  if (location) query.location = location.toLowerCase();
  
  if (occasion) {
    const occasionName = occasion.replace(/-/g, ' ');
    query.occasion = { $in: [occasionName] };
  }

  // Filter by rating
  if (rating) {
    query.ratingsAverage = { $gte: parseFloat(rating) };
  }

  // Filter by price
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Integrated search
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { shortDescription: { $regex: q, $options: 'i' } }
    ];
  }

  let sortQuery = '-createdAt';
  if (sort === 'price-low') sortQuery = 'price';
  if (sort === 'price-high') sortQuery = '-price';
  if (sort === 'rating') sortQuery = '-ratingsAverage';
  if (sort === 'newest') sortQuery = '-createdAt';

  const rawProducts = await Product.find(query)
    .sort(sortQuery)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const products = rawProducts.map(p => {
    const couponData = applyCoupon(p);
    const productObj = p.toObject();
    
    let sellingPrice;
    if (p.hasVariants && p.variants && p.variants.length > 0) {
      sellingPrice = p.variants[0].price;
    } else {
      sellingPrice = (p.offerPrice && p.offerPrice < p.price) ? p.offerPrice : p.price;
    }

    return {
      ...productObj,
      couponAvailable: !!couponData,
      finalPrice: sellingPrice,
      discountText: couponData ? couponData.discountText : null,
      activeCouponCode: couponData ? couponData.code : null,
      priceWithCoupon: couponData ? couponData.finalPrice : sellingPrice
    };
  });

  const total = await Product.countDocuments(query);
  res.status(200).json({ status: 'success', total, data: products });
});

exports.validateCoupon = asyncHandler(async (req, res, next) => {
  const { productId, code } = req.body;
  
  if (!productId || !code) {
    return next(new AppError('Product ID and coupon code are required', 400));
  }
  
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Check if coupon exists and is enabled
  if (!product.coupon || !product.coupon.enabled) {
    return next(new AppError('No active coupon available for this product', 400));
  }
  
  // Case-insensitive code comparison
  const normalizedInputCode = code.trim().toUpperCase();
  const normalizedCouponCode = product.coupon.code.trim().toUpperCase();
  
  if (normalizedCouponCode !== normalizedInputCode) {
    return next(new AppError('Invalid coupon code', 400));
  }
  
  const now = new Date();
  
  // Check start date
  if (product.coupon.startDate) {
    const startDate = new Date(product.coupon.startDate);
    if (now < startDate) {
      return next(new AppError(`Coupon is not valid until ${startDate.toLocaleDateString()}`, 400));
    }
  }
  
  // Check end date
  if (product.coupon.endDate) {
    const endDate = new Date(product.coupon.endDate);
    if (now > endDate) {
      return next(new AppError(`Coupon expired on ${endDate.toLocaleDateString()}`, 400));
    }
  }
  
  // Check usage limit
  if (product.coupon.usageLimit) {
    const usedCount = product.coupon.usedCount || 0;
    if (usedCount >= product.coupon.usageLimit) {
      return next(new AppError('Coupon usage limit has been reached', 400));
    }
  }
  
  // Calculate discount using applyCoupon
  const couponData = applyCoupon(product);
  if (!couponData) {
    return next(new AppError('Invalid or expired coupon code', 400));
  }
  
  // Determine selling price (consider variants and offer price)
  let sellingPrice;
  if (product.hasVariants && product.variants && product.variants.length > 0) {
    sellingPrice = product.variants[0].price;
  } else {
    sellingPrice = (product.offerPrice && product.offerPrice < product.price) ? product.offerPrice : product.price;
  }
  
  // Recalculate final price based on selling price
  let finalPrice = sellingPrice;
  let saved = 0;
  let discountText = '';
  
  if (product.coupon.type === 'flat') {
    saved = product.coupon.value;
    finalPrice = Math.max(0, sellingPrice - saved);
    discountText = `Save ₹${saved}`;
  } else if (product.coupon.type === 'percent') {
    saved = (sellingPrice * product.coupon.value) / 100;
    finalPrice = Math.max(0, sellingPrice - saved);
    discountText = `${product.coupon.value}% OFF`;
  } else if (product.coupon.type === 'price') {
    finalPrice = product.coupon.value;
    saved = sellingPrice - finalPrice;
    discountText = `Special price: ₹${finalPrice}`;
  }
  
  res.status(200).json({ 
    status: 'success', 
    data: { 
      valid: true, 
      code: product.coupon.code,
      originalPrice: sellingPrice,
      finalPrice: Math.round(finalPrice), 
      saved: Math.round(saved),
      discountText,
      type: product.coupon.type,
      value: product.coupon.value
    } 
  });
});

exports.getProduct = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  if (!slug) return next(new AppError('Product identifier missing', 400));

  let product;
  
  if (slug.match(/^[0-9a-fA-F]{24}$/)) {
    try {
      product = await Product.findById(slug);
    } catch (err) {
      console.error('FindById error:', err);
    }
  }

  if (!product) {
    product = await Product.findOne({ slug: slug, isActive: true });
  }

  if (!product) return next(new AppError('Product not found', 404));

  let couponData = null;
  try {
    couponData = applyCoupon(product);
  } catch (err) {
    console.error('Coupon calculation error:', err);
  }

  let sellingPrice;
  if (product.hasVariants && product.variants && product.variants.length > 0) {
    sellingPrice = product.variants[0].price;
  } else {
    sellingPrice = (product.offerPrice && product.offerPrice < product.price) ? product.offerPrice : product.price;
  }

  res.status(200).json({ 
    status: 'success', 
    data: { 
      ...product.toObject(), 
      couponAvailable: !!couponData, 
      finalPrice: sellingPrice, 
      discountText: couponData ? couponData.discountText : null,
      priceWithCoupon: couponData ? couponData.finalPrice : sellingPrice
    } 
  });
});

exports.createProduct = asyncHandler(async (req, res, next) => {
  const body = { ...req.body };
  
  // FIX: Normalize boolean fields first (critical for CastError fix)
  body.hasVariants = normalizeBoolean(body.hasVariants);
  body.allowCustomFlavor = normalizeBoolean(body.allowCustomFlavor);
  body.allowCustomWeight = normalizeBoolean(body.allowCustomWeight);
  
  // FIX: Normalize category to lowercase and trim (for dynamic category support)
  if (body.category) {
    body.category = body.category.trim().toLowerCase();
  }
  
  Object.keys(body).forEach(key => {
    if (typeof body[key] === 'string') {
      const trimmed = body[key].trim();
      if (trimmed === 'true') {
        body[key] = true;
      } else if (trimmed === 'false') {
        body[key] = false;
      } else if (trimmed !== '' && !isNaN(trimmed) && !['name', 'slug', 'description', 'shortDescription', 'image', 'occasion', 'flavors', 'weights', 'variants', 'category'].includes(key)) {
        body[key] = Number(trimmed);
      } else {
        body[key] = trimmed;
      }
    }
  });

  // Handle occasion array
  if (body.occasion) {
    if (Array.isArray(body.occasion)) {
      body.occasion = body.occasion;
    } else if (typeof body.occasion === 'string') {
      try {
        const parsed = JSON.parse(body.occasion);
        body.occasion = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        body.occasion = body.occasion.split(',').map(o => o.trim()).filter(Boolean);
      }
    }
  } else {
    body.occasion = [];
  }

  // Handle variant data for cakes (with multiple images per flavor)
  if (body.category === 'cakes') {
    if (body.flavors && typeof body.flavors === 'string') {
      try {
        const parsedFlavors = JSON.parse(body.flavors);
        // Ensure each flavor has images array
        body.flavors = parsedFlavors.map(flavor => ({
          name: flavor.name,
          images: flavor.images || []
        }));
      } catch (e) {}
    }
    if (body.weights && typeof body.weights === 'string') {
      try {
        body.weights = JSON.parse(body.weights);
      } catch (e) {}
    }
    if (body.variants && typeof body.variants === 'string') {
      try {
        body.variants = JSON.parse(body.variants);
      } catch (e) {}
    }
    // Use normalized boolean values
    if (body.hasVariants === undefined) {
      body.hasVariants = true;
    }
  } else {
    delete body.flavors;
    delete body.weights;
    delete body.variants;
    delete body.hasVariants;
    delete body.allowCustomFlavor;
    delete body.allowCustomWeight;
  }

  // Handle nested coupon object
  if (body['coupon.enabled'] !== undefined) {
    const isEnabled = body['coupon.enabled'] === 'true' || body['coupon.enabled'] === true;
    
    if (!isEnabled) {
      body.coupon = { enabled: false };
    } else {
      body.coupon = {
        enabled: true,
        code: body['coupon.code']?.trim(),
        type: body['coupon.type']?.trim() || 'percent',
        value: Number(body['coupon.value']) || 0,
        startDate: body['coupon.startDate'] || null,
        endDate: body['coupon.endDate'] || null,
        usageLimit: body['coupon.usageLimit'] ? Number(body['coupon.usageLimit']) : null,
        usedCount: 0
      };
    }
    
    Object.keys(body).forEach(key => {
      if (key.startsWith('coupon.')) delete body[key];
    });
  }

  let imageInput = body.image;
  if (req.file) {
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    imageInput = `data:${req.file.mimetype};base64,${b64}`;
  }

  if (!imageInput && body.category === 'cakes') {
    imageInput = DEFAULT_CAKE_IMAGE_URL;
  }

  if (imageInput) {
    const uploadResult = await cloudinaryService.uploadImage(imageInput, body.category || 'general');
    if (uploadResult) {
      body.image = uploadResult.secure_url;
      body.imagePublicId = uploadResult.public_id;
    } else if (!body.image) {
      body.image = DEFAULT_CAKE_IMAGE_URL;
    }
  }

  body.slug = slugify(body.name, { lower: true });
  body.createdBy = req.user._id;
  
  const product = await Product.create(body);
  
  // Trigger Push Notification asynchronously
  notificationManager.notifyNewProduct(product).catch(console.error);
  
  if (product.coupon && product.coupon.enabled) {
    notificationManager.notifyCouponAdded(product).catch(console.error);
  }
  
  res.status(201).json({ status: 'success', data: product });
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));

  const oldCouponCode = product.coupon?.code;
  const oldCouponEnabled = product.coupon?.enabled;

  const body = { ...req.body };
  
  // FIX: Normalize boolean fields first (critical for CastError fix)
  const hasVariants = normalizeBoolean(body.hasVariants);
  const allowCustomFlavor = normalizeBoolean(body.allowCustomFlavor);
  const allowCustomWeight = normalizeBoolean(body.allowCustomWeight);
  
  // FIX: Normalize category to lowercase and trim (for dynamic category support)
  if (body.category) {
    body.category = body.category.trim().toLowerCase();
  }
  
  Object.keys(body).forEach(key => {
    if (typeof body[key] === 'string') {
      const trimmed = body[key].trim();
      if (trimmed === 'true') {
        body[key] = true;
      } else if (trimmed === 'false') {
        body[key] = false;
      } else if (trimmed !== '' && !isNaN(trimmed) && !['name', 'slug', 'description', 'shortDescription', 'image', 'occasion', 'flavors', 'weights', 'variants', 'category'].includes(key)) {
        body[key] = Number(trimmed);
      } else {
        body[key] = trimmed;
      }
    }
  });

  // Handle occasion array
  if (body.occasion !== undefined) {
    if (Array.isArray(body.occasion)) {
      product.occasion = body.occasion;
    } else if (typeof body.occasion === 'string') {
      try {
        const parsed = JSON.parse(body.occasion);
        product.occasion = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        product.occasion = body.occasion.split(',').map(o => o.trim()).filter(Boolean);
      }
    }
  }

  // Handle variant data for cakes (with multiple images per flavor)
  const finalCategory = body.category || product.category;
  if (finalCategory === 'cakes') {
    if (body.flavors !== undefined) {
      if (typeof body.flavors === 'string') {
        try {
          const parsedFlavors = JSON.parse(body.flavors);
          product.flavors = parsedFlavors.map(flavor => ({
            name: flavor.name,
            images: flavor.images || []
          }));
        } catch (e) {}
      } else {
        product.flavors = body.flavors;
      }
    }
    if (body.weights !== undefined) {
      if (typeof body.weights === 'string') {
        try {
          product.weights = JSON.parse(body.weights);
        } catch (e) {}
      } else {
        product.weights = body.weights;
      }
    }
    if (body.variants !== undefined) {
      if (typeof body.variants === 'string') {
        try {
          product.variants = JSON.parse(body.variants);
        } catch (e) {}
      } else {
        product.variants = body.variants;
      }
    }
    // Use normalized boolean values
    if (body.hasVariants !== undefined) product.hasVariants = hasVariants;
    if (body.allowCustomFlavor !== undefined) product.allowCustomFlavor = allowCustomFlavor;
    if (body.allowCustomWeight !== undefined) product.allowCustomWeight = allowCustomWeight;
  } else {
    product.flavors = undefined;
    product.weights = undefined;
    product.variants = undefined;
    product.hasVariants = false;
    product.allowCustomFlavor = false;
    product.allowCustomWeight = false;
  }

  // Handle nested coupon object
  if (body['coupon.enabled'] !== undefined) {
    const isEnabled = body['coupon.enabled'] === 'true' || body['coupon.enabled'] === true;

    if (!isEnabled) {
      product.coupon = { enabled: false };
    } else {
      product.coupon = {
        enabled: true,
        code: body['coupon.code']?.trim(),
        type: body['coupon.type']?.trim() || 'percent',
        value: Number(body['coupon.value']) || 0,
        startDate: body['coupon.startDate'] || product.coupon?.startDate || null,
        endDate: body['coupon.endDate'] || product.coupon?.endDate || null,
        usageLimit: body['coupon.usageLimit'] ? Number(body['coupon.usageLimit']) : product.coupon?.usageLimit || null,
        usedCount: product.coupon?.usedCount || 0
      };
    }

    Object.keys(body).forEach(key => {
      if (key.startsWith('coupon.')) delete body[key];
    });
  }

  // Handle other fields (including dynamic category)
  const fieldsToUpdate = ['name', 'description', 'shortDescription', 'price', 'offerPrice', 'category', 'location', 'stock', 'featured', 'bestseller', 'isActive'];
  fieldsToUpdate.forEach(field => {
    if (body[field] !== undefined) {
      product[field] = body[field];
    }
  });

  // Handle image update
  let imageInput = body.image;
  if (req.file) {
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    imageInput = `data:${req.file.mimetype};base64,${b64}`;
  }

  if (imageInput && imageInput !== product.image) {
    if (product.imagePublicId) {
      await cloudinaryService.deleteImage(product.imagePublicId);
    }
    
    const uploadResult = await cloudinaryService.uploadImage(imageInput, body.category || product.category);
    if (uploadResult) {
      product.image = uploadResult.secure_url;
      product.imagePublicId = uploadResult.public_id;
    }
  }

  if (body.name) product.slug = slugify(body.name, { lower: true });

  await product.save();

  // Trigger real-time notifications for the update
  const notificationManager = require('../services/notificationManager');
  notificationManager.notifyProductUpdated(product).catch(console.error);

  if (product.coupon && product.coupon.enabled && (!oldCouponEnabled || oldCouponCode !== product.coupon.code)) {
    notificationManager.notifyCouponAdded(product).catch(console.error);
  }

  res.status(200).json({ status: 'success', data: product });
});

exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));

  if (product.imagePublicId) {
    await cloudinaryService.deleteImage(product.imagePublicId);
  }

  await product.deleteOne();
  res.status(204).json({ status: 'success', data: null });
});

exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  req.query.featured = 'true';
  return exports.getProducts(req, res);
});

exports.getProductsByCategory = asyncHandler(async (req, res) => {
  req.query.category = req.params.category;
  return exports.getProducts(req, res);
});

exports.searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const rawProducts = await Product.find({
    $text: { $search: q },
    isActive: true
  }).sort({ score: { $meta: 'textScore' } });

  const products = rawProducts.map(p => {
    const couponData = applyCoupon(p);
    let sellingPrice;
    if (p.hasVariants && p.variants && p.variants.length > 0) {
      sellingPrice = p.variants[0].price;
    } else {
      sellingPrice = p.price;
    }
    return {
      ...p.toObject(),
      couponAvailable: !!couponData,
      finalPrice: sellingPrice
    };
  });

  res.status(200).json({ status: 'success', total: products.length, data: products });
});