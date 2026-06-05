const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Payment = require('../models/Payment');
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

// Keep backend pricing consistent with frontend checkout.
// Frontend uses:
// - deliveryFee = max(30, round(distanceKm * 4))
// - convenienceFee = round(subtotal * 0.02)
// - gst = round(subtotal * 0.18)
// and totals are in INR (Razorpay expects paise).
const SHOP_LAT = Number(process.env.SHOP_LAT ?? 11.004540031168712);
const SHOP_LNG = Number(process.env.SHOP_LNG ?? 76.97510955713153);
const DELIVERY_MIN_FEE = Number(process.env.DELIVERY_MIN_FEE ?? 30);
const DELIVERY_PER_KM_RATE = Number(process.env.DELIVERY_PER_KM_RATE ?? 4);

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const computePricing = ({ cartItems, addressLat, addressLng, discount = 0 }) => {
  const subtotal = cartItems.reduce((sum, item) => {
    const unitPrice = Number(item.finalPrice ?? item.price ?? 0);
    const qty = Number(item.qty ?? 0);
    return sum + unitPrice * qty;
  }, 0);

  let deliveryCharge = 0;
  if (Number.isFinite(addressLat) && Number.isFinite(addressLng)) {
    const distanceKm = calculateDistanceKm(SHOP_LAT, SHOP_LNG, addressLat, addressLng);
    deliveryCharge = Math.max(DELIVERY_MIN_FEE, Math.round(distanceKm * DELIVERY_PER_KM_RATE));
  }

  const convenienceFee = Math.round(subtotal * 0.02);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + deliveryCharge + convenienceFee + gst - (Number(discount) || 0);

  return { subtotal, deliveryCharge, convenienceFee, gst, total };
};

const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${random}`;
};

const validateAddress = (address) => {
  if (!address) {
    throw new Error('Address is required');
  }
  if (!address.fullName || !address.fullName.trim()) {
    throw new Error('Full name is required in address');
  }
  if (!address.phone || !address.phone.trim()) {
    throw new Error('Phone number is required in address');
  }
  return true;
};

exports.createRazorpayOrder = asyncHandler(async (req, res) => {
  const { address, discount, couponCode, deliveryDate, deliverySlot, directItem, notes, cakeMessage } = req.body;

  if (!req.user || !req.user._id) {
    throw new AppError('Unauthorized user', 401);
  }

  try {
    validateAddress(address);
  } catch (err) {
    throw new AppError(err.message, 400);
  }

  let normalizedSlot = deliverySlot;

  const slotMap = {
    'Morning (9-12)': 'Morning',
    'Afternoon (12-4)': 'Afternoon',
    'Evening (4-8)': 'Evening',
    'Night (8-11)': 'Night',
    'Morning (9AM-12PM)': 'Morning',
    'Afternoon (12PM-4PM)': 'Afternoon',
    'Evening (4PM-8PM)': 'Evening',
    'Night (8PM-11PM)': 'Night',
    '10am-1pm': '10am-1pm',
    '1pm-4pm': '1pm-4pm',
    '4pm-7pm': '4pm-7pm',
    '7pm-10pm': '7pm-10pm'
  };

  if (slotMap[deliverySlot]) {
    normalizedSlot = slotMap[deliverySlot];
  }

  let cart;

  if (directItem) {
    let dbProductId = directItem.productId;
    if (typeof dbProductId === 'string' && dbProductId.startsWith('custom-')) {
      const parts = dbProductId.split('-');
      dbProductId = parts[parts.length - 1];
    }
    const product = await Product.findById(dbProductId);
    if (!product || product.stock < directItem.qty) {
      throw new AppError(`Stock error: ${product?.name || 'Item'} unavailable`, 400);
    }
    
    // Check variants for cake
    let salePrice = product.offerPrice && product.offerPrice < product.price ? product.offerPrice : product.price;
    let variantPrice = null;
    if (product.hasVariants && product.variants && directItem.selectedFlavor && directItem.selectedWeight) {
      const variant = product.variants.find(
        v => v.flavor === directItem.selectedFlavor && v.weight === directItem.selectedWeight
      );
      if (variant) {
        variantPrice = variant.price;
        salePrice = variant.price;
      }
      if (variant && variant.stock < directItem.qty) {
        throw new AppError(`Stock error: Selected combination unavailable`, 400);
      }
    }
    
    let finalPrice = salePrice;
    let activeCouponCode = null;
    
    // Check coupon
    if (directItem.appliedCoupon && product.coupon && product.coupon.enabled && product.coupon.code.toUpperCase() === directItem.appliedCoupon.toUpperCase()) {
      const now = new Date();
      const startDate = product.coupon.startDate ? new Date(product.coupon.startDate) : null;
      const endDate = product.coupon.endDate ? new Date(product.coupon.endDate) : null;
      
      const isWithinDateRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);
      const isWithinUsageLimit = !product.coupon.usageLimit || (product.coupon.usedCount || 0) < product.coupon.usageLimit;
      
      if (isWithinDateRange && isWithinUsageLimit) {
        activeCouponCode = product.coupon.code;
        if (product.coupon.type === 'flat') {
          finalPrice = Math.max(0, salePrice - product.coupon.value);
        } else if (product.coupon.type === 'percent') {
          finalPrice = Math.max(0, salePrice - Math.round((salePrice * product.coupon.value) / 100));
        } else if (product.coupon.type === 'price') {
          finalPrice = product.coupon.value;
        }
      }
    }
    
    let isCustomCake = false;
    let customDetails = null;
    if (product.category === 'Custom Cakes' || (directItem.options && directItem.options.theme)) {
      isCustomCake = true;
      const tierNum = directItem.options.tier ? parseInt(directItem.options.tier.replace(/\D/g, '')) || 1 : 1;
      customDetails = {
        shape: 'round',
        tiers: tierNum,
        weight: directItem.options.weight || '1 kg',
        flavour: `${directItem.options.color || ''} (Flavour: ${directItem.options.flavor || ''})`,
        designTheme: directItem.options.theme || 'Teddy Theme',
        messageOnCake: `Name: ${directItem.options.name || ''}, Age: ${directItem.options.age || ''}, Message: ${directItem.options.message || ''}`,
        notes: directItem.options.notes || ''
      };
    }

    cart = {
      items: [{
        productId: product._id,
        name: product.name,
        qty: directItem.qty,
        price: product.price,
        image: product.image,
        finalPrice: finalPrice,
        activeCouponCode: activeCouponCode,
        selectedFlavor: directItem.selectedFlavor || (directItem.options && directItem.options.flavor),
        selectedWeight: directItem.selectedWeight || (directItem.options && directItem.options.weight),
        isCustomCake,
        customDetails
      }],
      total: finalPrice * directItem.qty
    };
  } else {
    // Check if items are provided in the request body (Redux cart)
    if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
      const validatedItems = [];
      let total = 0;

      for (const item of req.body.items) {
        let dbProductId = item.productId;
        if (typeof dbProductId === 'string' && dbProductId.startsWith('custom-')) {
          const parts = dbProductId.split('-');
          dbProductId = parts[parts.length - 1];
        }
        const product = await Product.findById(dbProductId);
        if (!product || product.stock < item.qty) {
          throw new AppError(`Stock error: ${product?.name || 'Item'} unavailable`, 400);
        }

        let salePrice = product.offerPrice && product.offerPrice < product.price ? product.offerPrice : product.price;
        if (product.hasVariants && product.variants && item.options?.flavor && item.options?.weight) {
          const variant = product.variants.find(
            v => v.flavor === item.options.flavor && v.weight === item.options.weight
          );
          if (variant) {
            salePrice = variant.price;
          }
        }

        let finalPrice = salePrice;
        let activeCouponCode = null;

        // Check coupon logic if applicable to this product
        if (product.coupon && product.coupon.enabled && couponCode && product.coupon.code.toUpperCase() === String(couponCode).toUpperCase()) {
          const now = new Date();
          const startDate = product.coupon.startDate ? new Date(product.coupon.startDate) : null;
          const endDate = product.coupon.endDate ? new Date(product.coupon.endDate) : null;
          
          const isWithinDateRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);
          const isWithinUsageLimit = !product.coupon.usageLimit || (product.coupon.usedCount || 0) < product.coupon.usageLimit;
          
          if (isWithinDateRange && isWithinUsageLimit) {
            activeCouponCode = product.coupon.code;
            if (product.coupon.type === 'flat') {
              finalPrice = Math.max(0, salePrice - product.coupon.value);
            } else if (product.coupon.type === 'percent') {
              finalPrice = Math.max(0, salePrice - Math.round((salePrice * product.coupon.value) / 100));
            } else if (product.coupon.type === 'price') {
              finalPrice = product.coupon.value;
            }
          }
        }

        let isCustomCake = false;
        let customDetails = null;
        if (product.category === 'Custom Cakes' || (item.options && item.options.theme)) {
          isCustomCake = true;
          const tierNum = item.options.tier ? parseInt(item.options.tier.replace(/\D/g, '')) || 1 : 1;
          customDetails = {
            shape: 'round',
            tiers: tierNum,
            weight: item.options.weight || '1 kg',
            flavour: `${item.options.color || ''} (Flavour: ${item.options.flavor || ''})`,
            designTheme: item.options.theme || 'Teddy Theme',
            messageOnCake: `Name: ${item.options.name || ''}, Age: ${item.options.age || ''}, Message: ${item.options.message || ''}`,
            notes: item.options.notes || ''
          };
        }

        validatedItems.push({
          productId: product._id,
          name: product.name,
          qty: item.qty,
          price: product.price,
          image: product.image,
          finalPrice: finalPrice,
          activeCouponCode: activeCouponCode,
          selectedFlavor: item.options?.color || item.options?.flavor,
          selectedWeight: item.options?.weight,
          isCustomCake,
          customDetails
        });
        total += finalPrice * item.qty;
      }

      cart = { items: validatedItems, total };
    } else {
      const cartKey = `cart:${req.user._id}`;
      const cartData = await cacheService.get(cartKey);

      if (!cartData) {
        throw new AppError('Cart is empty', 400);
      }

      cart = typeof cartData === 'string' ? JSON.parse(cartData) : cartData;
    }
  }

  if (!cart.items || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // ✅ PREVENT DUPLICATE ORDERS - Check for existing pending order
  const existingPendingOrder = await Order.findOne({
    userId: req.user._id,
    paymentStatus: 'pending',
    orderStatus: 'confirmed',
    createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
  });

  if (existingPendingOrder && existingPendingOrder.razorpayOrderId) {
    // Return existing order instead of creating new one
    return res.status(200).json({
      status: 'success',
      data: {
        razorpayOrder: { id: existingPendingOrder.razorpayOrderId },
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

  if (!directItem) {
    for (const item of cart.items) {
      let dbProductId = item.productId;
      if (typeof dbProductId === 'string' && dbProductId.startsWith('custom-')) {
        const parts = dbProductId.split('-');
        dbProductId = parts[parts.length - 1];
      }
      const product = await Product.findById(dbProductId);

      if (!product || product.stock < item.qty) {
        throw new AppError(`Stock error: ${product?.name || 'Item'} unavailable`, 400);
      }
    }
  }

  const { subtotal, deliveryCharge, convenienceFee, gst, total } = computePricing({
    cartItems: cart.items,
    addressLat: Number(address?.lat),
    addressLng: Number(address?.lng),
    discount: 0,
  });

  let razorpayOrder;

  try {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw new AppError('Failed to create Razorpay order', 500);
  }

  const order = await Order.create({
    userId: req.user._id,
    items: cart.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      qty: item.qty,
      price: item.finalPrice ?? item.price ?? 0,
      originalPrice: item.price ?? 0,
      image: item.image,
      couponCode: item.activeCouponCode,
      selectedFlavor: item.selectedFlavor,
      selectedWeight: item.selectedWeight,
      discountAmount: ((item.price ?? 0) - (item.finalPrice ?? item.price ?? 0)) * item.qty,
      isCustomCake: item.isCustomCake || false,
      customDetails: item.customDetails || null
    })),
    subtotal,
    deliveryCharge,
    convenienceFee,
    gst,
    total,
    discount: 0,
    paymentMethod: 'ONLINE',
    paymentStatus: 'pending',
    orderStatus: 'confirmed',
    address: {
      fullName: address.fullName?.trim(),
      phone: address.phone?.trim(),
      houseNo: address.houseNo?.trim() || '',
      street: address.street?.trim() || '',
      city: address.city?.trim() || 'Coimbatore',
      pincode: address.pincode?.trim() || '641001',
      lat: address.lat ?? null,
      lng: address.lng ?? null
    },
    deliveryDate: deliveryDate || new Date(),
    deliverySlot: normalizedSlot,
    notes: typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
    cakeMessage:
      typeof cakeMessage === 'string' && cakeMessage.trim()
        ? cakeMessage.trim().slice(0, 500)
        : undefined,
    razorpayOrderId: razorpayOrder.id,
    paymentAttemptAt: new Date(),
    orderNumber: generateOrderNumber(),
    trackingCode: undefined
  });

  await Payment.create({
    orderId: order._id,
    razorpayOrderId: razorpayOrder.id,
    amount: total,
    status: 'created'
  });

  res.status(200).json({
    status: 'success',
    data: {
      razorpayOrder,
      orderId: order._id,
      pricing: {
        subtotal,
        deliveryCharge,
        convenienceFee,
        gst,
        total
      }
    }
  });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError('Missing payment verification fields', 400);
  }

  // ✅ Check if order already exists and is already paid (prevent duplicate verification)
  const existingOrder = await Order.findById(orderId);
  if (existingOrder && existingOrder.paymentStatus === 'paid') {
    // Order already verified, return success without processing again
    return res.status(200).json({
      status: 'success',
      message: 'Order already verified',
      data: existingOrder
    });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });

    await Payment.findOneAndUpdate(
      { orderId },
      {
        status: 'failed',
        failureReason: 'Payment verification failed'
      }
    );

    throw new AppError('Payment verification failed', 400);
  }

  const order = await Order.findById(orderId).populate('userId');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const year = new Date().getFullYear();
  const orderCount = await Order.countDocuments({
    createdAt: {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${year + 1}-01-01`)
    }
  });

  const nextNum = (orderCount + 1).toString().padStart(4, '0');
  const trackingCode = `TCM-${year}-${nextNum}`;

  order.paymentStatus = 'paid';
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  order.trackingCode = trackingCode;
  order.orderNumber = trackingCode;

  await order.save();

  await Payment.findOneAndUpdate(
    { orderId },
    {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'paid'
    }
  );

  await cacheService.del(`cart:${order.userId._id}`);

  // Update Stock
  for (const item of order.items) {
    // 1. Decrement main stock
    const product = await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { stock: -item.qty } },
      { new: true }
    );

    // 2. Decrement variant stock if applicable
    if (product && product.hasVariants && item.selectedFlavor && item.selectedWeight) {
      await Product.updateOne(
        { 
          _id: item.productId, 
          "variants.flavor": item.selectedFlavor, 
          "variants.weight": item.selectedWeight 
        },
        { 
          $inc: { "variants.$.stock": -item.qty } 
        }
      );
    }

    // 3. Emit real-time stock update
    if (ioInstance) {
      const socketData = {
        productId: item.productId,
        newStock: product ? product.stock : 0
      };

      // Add variant info if this was a variant order
      if (product && product.hasVariants && item.selectedFlavor && item.selectedWeight) {
        const variant = product.variants.find(v => 
          v.flavor === item.selectedFlavor && v.weight === item.selectedWeight
        );
        if (variant) {
          socketData.variantUpdate = {
            flavor: item.selectedFlavor,
            weight: item.selectedWeight,
            newVariantStock: variant.stock
          };
        }
      }

      ioInstance.emit('stock_updated', socketData);
    }

    // Low stock alert
    if (product && product.stock <= 5) {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        if (admin.phone) {
          telegramService.sendLowStockAlert(admin.phone, product.name, product.stock).catch(e => console.error(e));
        }
      }
    }
  }

  // Notifications
  try {
    const notificationManager = require('../services/notificationManager');
    if (notificationManager && typeof notificationManager.notifyOrderSuccess === 'function') {
      notificationManager.notifyOrderSuccess(order).catch(err => console.error('Notification error:', err));
    }
  } catch (err) {
    console.error('Failed to load notification manager:', err);
  }

  res.status(200).json({
    status: 'success',
    data: order
  });
});

exports.handlePaymentFailure = asyncHandler(async (req, res) => {
  const { orderId, reason } = req.body;

  if (orderId) {
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'failed',
      paymentFailureReason: reason || 'Payment failed'
    });

    await Payment.findOneAndUpdate(
      { orderId },
      {
        status: 'failed',
        failureReason: reason || 'Payment failed'
      }
    );
  }

  res.status(200).json({ status: 'success' });
});

exports.getPaymentStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.status(200).json({
    status: 'success',
    paymentStatus: order.paymentStatus
  });
});

exports.handleWebhook = asyncHandler(async (req, res) => {
  console.log('Webhook:', req.body);
  res.status(200).send('OK');
});

module.exports.setIo = setIo;