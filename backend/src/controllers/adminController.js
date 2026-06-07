const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const Product = require('../models/Product');
const slugify = require('slugify');
const cloudinaryService = require('../services/cloudinaryService');
const DEFAULT_CAKE_IMAGE_URL = 'https://via.placeholder.com/800x600.png?text=Chocolate+Mine+Cake+Background';

const normalizeStockValue = (value) => {
  if (value === true || value === 'true') return 1;
  if (value === false || value === 'false') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// @desc    Create Staff Member
// @route   POST /api/admin/staff/create
// @access  Admin Only
exports.createStaff = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    return next(new AppError('Account with this email or phone already exists', 400));
  }

  // Create staff user
  const staff = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'staff',
    active: true,
    isVerified: true,
    provider: 'local'
  });

  res.status(201).json({
    status: 'success',
    data: {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      role: staff.role
    }
  });
});

// @desc    Get All Staff
// @route   GET /api/admin/staff
exports.getAllStaff = asyncHandler(async (req, res) => {
  const staff = await User.find({ role: 'staff' }).select('-password');
  res.status(200).json({
    status: 'success',
    count: staff.length,
    data: staff
  });
});

// @desc    Update Staff Details
// @route   PATCH /api/admin/staff/:id
exports.updateStaff = asyncHandler(async (req, res, next) => {
  const { name, email, phone, role, active, password } = req.body;
  
  const updateData = { name, email, phone, role, active };
  
  // Only update password if provided
  if (password && password.length >= 6) {
    updateData.password = password;
  }

  // Use findOne and save to trigger pre-save hooks (for password hashing)
  const staff = await User.findById(req.params.id);
  if (!staff) {
    return next(new AppError('Staff member not found', 404));
  }

  Object.assign(staff, updateData);
  await staff.save();

  res.status(200).json({
    status: 'success',
    data: staff
  });
});

// @desc    Delete Staff Member
// @route   DELETE /api/admin/staff/:id
exports.deleteStaff = asyncHandler(async (req, res, next) => {
  const staff = await User.findByIdAndDelete(req.params.id);

  if (!staff) {
    return next(new AppError('Staff member not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Admin Dashboard Stats (Updated for new order statuses)
// @route   GET /api/admin/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const Order = require('../models/Order');
  const Product = require('../models/Product');
  const User = require('../models/User');

  const [
    totalOrders,
    confirmedOrders,
    outForDeliveryOrders,
    deliveredOrders,
    totalProducts,
    totalUsers,
    revenueStats
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'confirmed' }),
    Order.countDocuments({ orderStatus: 'out_for_delivery' }),
    Order.countDocuments({ orderStatus: 'delivered' }),
    Product.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ])
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalOrders,
      confirmedOrders,
      outForDeliveryOrders,
      deliveredOrders,
      totalProducts,
      totalUsers,
      revenue: revenueStats[0]?.total || 0
    }
  });
});

// @desc    Generate and Download Invoice PDF (On-demand)
// @route   GET /api/admin/orders/:id/invoice
exports.downloadInvoice = asyncHandler(async (req, res, next) => {
  const invoiceService = require('../services/invoiceService');
  const Order = require('../models/Order');

  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));

  const pdfBuffer = await invoiceService.generateInvoiceBuffer(order._id);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.orderNumber}.pdf`);
  res.send(pdfBuffer);
});

// @desc    Manually Resend Invoice Email
// @route   POST /api/admin/orders/:id/resend-invoice
exports.resendInvoice = asyncHandler(async (req, res, next) => {
  const invoiceService = require('../services/invoiceService');
  const Order = require('../models/Order');

  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));

  const success = await invoiceService.sendInvoiceAfterDelivery(order._id, true);

  if (!success) {
    return next(new AppError('Failed to resend invoice. Check SMTP logs.', 500));
  }

  res.status(200).json({ status: 'success', message: 'Invoice resent successfully' });
});

// @desc    Create Product (with variant support and multiple images per flavor)
// @route   POST /api/admin/products
exports.createProduct = asyncHandler(async (req, res, next) => {
  const { category, occasion, flavors, weights, variants, hasVariants, allowCustomFlavor, allowCustomWeight, cakeType, basePrice, ...productData } = req.body;

  // Helper to compute weightPrices based on cakeType and base price
  const computeWeightPrices = (type, base) => {
    const b = Number(base) || 0;
    if ((type || '').toLowerCase() === 'bento-cakes') {
      return [
        { weight: '0.25', price: Math.round(b) },
        { weight: '0.5', price: Math.round(b * 2) }
      ];
    }
    // Default: half-kg base calculates 1kg = 2x and 1.5kg = 3x
    return [
      { weight: '0.5', price: Math.round(b) },
      { weight: '1', price: Math.round(b * 2) },
      { weight: '1.5', price: Math.round(b * 3) },
      { weight: '2', price: Math.round(b * 4) },
      { weight: '3', price: Math.round(b * 6) }
    ];
  };

  // Handle occasion array
  if (occasion !== undefined) {
    let finalOccasion = [];
    if (Array.isArray(occasion)) {
      finalOccasion = occasion;
    } else if (typeof occasion === 'string') {
      try {
        const parsed = JSON.parse(occasion);
        finalOccasion = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        finalOccasion = occasion.split(',').map(o => o.trim()).filter(Boolean);
      }
    }
    productData.occasion = finalOccasion;
  } else {
    productData.occasion = [];
  }

  // Handle variant data for cakes (with multiple images per flavor)
  if (category === 'cakes') {
    // Parse flavors - ensure images array exists
    if (flavors && typeof flavors === 'string') {
      try {
        const parsedFlavors = JSON.parse(flavors);
        productData.flavors = parsedFlavors.map(flavor => ({
          name: flavor.name,
          images: flavor.images || []
        }));
      } catch (e) {
        productData.flavors = [];
      }
    } else if (flavors) {
      productData.flavors = flavors;
    }

    if (weights && typeof weights === 'string') {
      try {
        productData.weights = JSON.parse(weights);
      } catch (e) {
        productData.weights = [];
      }
    } else if (weights) {
      productData.weights = weights;
    }

    if (variants && typeof variants === 'string') {
      try {
        productData.variants = JSON.parse(variants);
      } catch (e) {
        productData.variants = [];
      }
    } else if (variants) {
      productData.variants = variants;
    }

    productData.hasVariants = hasVariants === 'true' || hasVariants === true;
    productData.allowCustomFlavor = allowCustomFlavor === 'true' || allowCustomFlavor === true;
    productData.allowCustomWeight = allowCustomWeight === 'true' || allowCustomWeight === true;

    // Set cakeType if provided
    if (cakeType) productData.cakeType = (cakeType || '').toLowerCase();

    // If basePrice provided, compute weightPrices, weights and auto-generate variants prices
    if (basePrice !== undefined && basePrice !== null && basePrice !== '') {
      const weightPrices = computeWeightPrices(productData.cakeType, basePrice);
      productData.weightPrices = weightPrices;
      // Populate weights array used by frontend (e.g., '0.5 kg')
      productData.weights = weightPrices.map(w => ({ value: `${w.weight} kg` }));

      // Auto-generate variants using flavors if available
      const flavorList = productData.flavors || [];
      const generatedVariants = [];
      flavorList.forEach(fl => {
        weightPrices.forEach(wp => {
          generatedVariants.push({
            flavor: fl.name,
            weight: `${wp.weight} kg`,
            price: wp.price,
            stock: 0
          });
        });
      });
      // If there are no flavors, create generic variants (no flavor)
      if (flavorList.length === 0) {
        weightPrices.forEach(wp => {
          generatedVariants.push({ flavor: '', weight: `${wp.weight} kg`, price: wp.price, stock: 0 });
        });
      }
      productData.variants = generatedVariants;
      productData.hasVariants = generatedVariants.length > 0;
    }

  } else {
    // Non-cake products don't have variants
    productData.hasVariants = false;
    delete productData.flavors;
    delete productData.weights;
    delete productData.variants;
    delete productData.allowCustomFlavor;
    delete productData.allowCustomWeight;
  }

  productData.category = category;
  if (productData.stock !== undefined) {
    productData.stock = normalizeStockValue(productData.stock);
  }
  
  const product = await Product.create(productData);

  res.status(201).json({
    status: 'success',
    data: product
  });
});

// @desc    Update Product (with variant support and multiple images per flavor)
// @route   PATCH /api/admin/products/:id
exports.updateProduct = asyncHandler(async (req, res, next) => {
  const { category, occasion, flavors, weights, variants, hasVariants, allowCustomFlavor, allowCustomWeight, cakeType, basePrice, ...updateData } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Handle occasion array
  if (occasion !== undefined) {
    let finalOccasion = [];
    if (Array.isArray(occasion)) {
      finalOccasion = occasion;
    } else if (typeof occasion === 'string') {
      try {
        const parsed = JSON.parse(occasion);
        finalOccasion = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        finalOccasion = occasion.split(',').map(o => o.trim()).filter(Boolean);
      }
    }
    product.occasion = finalOccasion;
  }

  // Update category if provided
  const finalCategory = category || product.category;
  if (category) {
    product.category = category;
  }

  // Handle variant data for cakes (with multiple images per flavor)
  if (finalCategory === 'cakes') {
    if (flavors !== undefined) {
      if (typeof flavors === 'string') {
        try {
          const parsedFlavors = JSON.parse(flavors);
          product.flavors = parsedFlavors.map(flavor => ({
            name: flavor.name,
            images: flavor.images || []
          }));
        } catch (e) {
          product.flavors = [];
        }
      } else {
        product.flavors = flavors;
      }
    }
    if (weights !== undefined) {
      if (typeof weights === 'string') {
        try {
          product.weights = JSON.parse(weights);
        } catch (e) {
          product.weights = [];
        }
      } else {
        product.weights = weights;
      }
    }
    if (variants !== undefined) {
      if (typeof variants === 'string') {
        try {
          product.variants = JSON.parse(variants);
        } catch (e) {
          product.variants = [];
        }
      } else {
        product.variants = variants;
      }
    }

    // Update cakeType if provided
    if (cakeType !== undefined) {
      product.cakeType = (cakeType || '').toLowerCase();
    }

    // If basePrice provided, recompute weightPrices, weights and auto-generate variant prices
    if (basePrice !== undefined && basePrice !== null && basePrice !== '') {
      const computeWeightPrices = (type, base) => {
        const b = Number(base) || 0;
        if ((type || '').toLowerCase() === 'bento-cakes') {
          return [
            { weight: '0.25', price: Math.round(b) },
            { weight: '0.5', price: Math.round(b * 2) }
          ];
        }
        return [
          { weight: '0.5', price: Math.round(b) },
          { weight: '1', price: Math.round(b * 2) },
          { weight: '1.5', price: Math.round(b * 3) },
          { weight: '2', price: Math.round(b * 4) },
          { weight: '3', price: Math.round(b * 6) }
        ];
      };

      const weightPrices = computeWeightPrices(product.cakeType, basePrice);
      product.weightPrices = weightPrices;
      product.weights = weightPrices.map(w => ({ value: `${w.weight} kg` }));

      // Regenerate variants
      const flavorList = product.flavors || [];
      const generatedVariants = [];
      flavorList.forEach(fl => {
        weightPrices.forEach(wp => {
          generatedVariants.push({ flavor: fl.name, weight: `${wp.weight} kg`, price: wp.price, stock: 0 });
        });
      });
      if (flavorList.length === 0) {
        weightPrices.forEach(wp => {
          generatedVariants.push({ flavor: '', weight: `${wp.weight} kg`, price: wp.price, stock: 0 });
        });
      }
      product.variants = generatedVariants;
      product.hasVariants = generatedVariants.length > 0;
    }

    if (hasVariants !== undefined) {
      product.hasVariants = hasVariants === 'true' || hasVariants === true;
    }
    if (allowCustomFlavor !== undefined) {
      product.allowCustomFlavor = allowCustomFlavor === 'true' || allowCustomFlavor === true;
    }
    if (allowCustomWeight !== undefined) {
      product.allowCustomWeight = allowCustomWeight === 'true' || allowCustomWeight === true;
    }
  } else {
    // Non-cake products - remove variant fields
    product.hasVariants = false;
    product.flavors = undefined;
    product.weights = undefined;
    product.variants = undefined;
    product.allowCustomFlavor = false;
    product.allowCustomWeight = false;
  }

  if (updateData.stock !== undefined) {
    updateData.stock = normalizeStockValue(updateData.stock);
  }

  // Update other fields
  const fieldsToUpdate = ['name', 'description', 'shortDescription', 'price', 'offerPrice', 'location', 'stock', 'featured', 'bestseller', 'isActive'];
  fieldsToUpdate.forEach(field => {
    if (updateData[field] !== undefined) {
      product[field] = updateData[field];
    }
  });

  await product.save();

  res.status(200).json({
    status: 'success',
    data: product
  });
});

// @desc    Get Single Product
// @route   GET /api/admin/products/:id
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: product
  });
});

// @desc    Get All Products (with filter support)
// @route   GET /api/admin/products
exports.getAllProducts = asyncHandler(async (req, res) => {
  const { category, featured, bestseller, isActive } = req.query;
  const filter = {};
  
  if (category) filter.category = category;
  if (featured !== undefined) filter.featured = featured === 'true';
  if (bestseller !== undefined) filter.bestseller = bestseller === 'true';
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const products = await Product.find(filter).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    count: products.length,
    data: products
  });
});

// @desc    Delete Product
// @route   DELETE /api/admin/products/:id
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get All Orders (Admin view-only - no edit buttons)
// @route   GET /api/admin/orders
exports.getAllOrders = asyncHandler(async (req, res) => {
  const Order = require('../models/Order');
  
  const orders = await Order.find()
    .populate('userId', 'name email phone')
    .populate('assignedStaff', 'name')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    count: orders.length,
    data: orders
  });
});

// @desc    Get Single Order Details (Admin view-only)
// @route   GET /api/admin/orders/:id
exports.getOrderDetails = asyncHandler(async (req, res, next) => {
  const Order = require('../models/Order');
  
  const order = await Order.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('assignedStaff', 'name');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: order
  });
});

// @desc    Admin custom FCM broadcast to all active users
// @route   POST /api/admin/broadcast
// @access  Admin Only
exports.broadcastNotification = asyncHandler(async (req, res, next) => {
  const { title, message, url, type } = req.body;

  if (!title || !message) {
    return next(new AppError('Title and message are required for broadcast', 400));
  }

  const notificationManager = require('../services/notificationManager');
  await notificationManager.sendAdminBroadcast(title, message, {
    url: url || '',
    type: type || 'broadcast'
  });

  res.status(200).json({
    status: 'success',
    message: 'Broadcast notification sent to all active users successfully'
  });
});