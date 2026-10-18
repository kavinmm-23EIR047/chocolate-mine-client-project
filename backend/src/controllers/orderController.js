const Order = require('../models/Order');
const InShopOrder = require('../models/InShopOrder');
const User = require('../models/User');
const Product = require('../models/Product');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const cacheService = require('../services/cacheService');
const telegramService = require('../services/telegramService');
const invoiceService = require('../services/invoiceService');
const notificationManager = require('../services/notificationManager');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Store io instance
let ioInstance = null;

// Function to set io instance from server
const setIo = (io) => {
  ioInstance = io;
  console.log('✅ Socket.io instance set in orderController');
};

// Helper to emit socket event for real-time updates
const emitOrderUpdate = (order) => {
  if (!ioInstance) {
    console.log('⚠️ Socket.io not initialized, skipping emit');
    return;
  }
  
  if (!order) return;
  
  // Emit to order room
  ioInstance.to(`order_${order._id}`).emit('order_detail_updated', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.orderStatus,
    updatedAt: order.updatedAt
  });
  
  // Emit to user room
  if (order.userId) {
    ioInstance.to(`user_${order.userId}`).emit('my_order_updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      updatedAt: order.updatedAt
    });
    ioInstance.to(`user_${order.userId}`).emit('orders_needs_refresh');
  }
  
  // Emit to admin room
  ioInstance.to('admin_room').emit('order_status_updated', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.orderStatus,
    updatedAt: order.updatedAt
  });
  ioInstance.to('admin_room').emit('dashboard_needs_refresh');
  
  // Broadcast general order status change
  ioInstance.emit('order_status_changed', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.orderStatus,
    updatedAt: order.updatedAt
  });
  
  console.log(`📡 Socket: Order ${order.orderNumber} status = ${order.orderStatus}`);
};

// Helper function to generate SKU for an item
const generateSKU = (productName, category, flavor, weight, index) => {
  const nameCode = productName.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
  const categoryCode = category ? category.substring(0, 3).toUpperCase() : 'PRD';
  const flavorCode = flavor ? flavor.substring(0, 2).toUpperCase() : 'ST';
  let weightCode = 'KG';
  if (weight) {
    const weightNum = weight.replace(/[^0-9.]/g, '');
    if (weightNum) {
      weightCode = weightNum.replace('.', '').substring(0, 2);
    }
  }
  const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const seqNum = String(index + 1).padStart(3, '0');
  return `${nameCode}-${categoryCode}-${flavorCode}-${weightCode}-${dateCode}-${seqNum}`;
};

// Helper function to generate order number (user-friendly format)
const generateOrderNumber = () => {
  const random = Math.floor(100 + Math.random() * 900);
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${letter}${random}${Date.now().toString().slice(-3)}`;
};

// Helper function to generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send SMS (placeholder - integrate with actual SMS provider)
const sendSms = async (phoneNumber, message) => {
  console.log(`📱 SMS to ${phoneNumber}: ${message}`);
  // TODO: Integrate with SMS provider (Twilio, MSG91, etc.)
  return true;
};

// @desc Place new order - DISABLED (Use payment flow instead)
// @route POST /api/v1/orders/place
exports.placeOrder = asyncHandler(async (req, res, next) => {
  // DISABLED - This endpoint is not used. Orders are created via payment flow.
  // To prevent duplicate orders, this endpoint returns error.
  return next(new AppError('Direct order placement is disabled. Please complete payment to place order.', 400));
});

// @desc Get my orders
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort('-createdAt');

  // Add SKU summary to each order
  const ordersWithSKUs = orders.map(order => ({
    ...order.toObject(),
    skus: order.items.map(item => item.sku)
  }));

  res.status(200).json({
    status: 'success',
    data: ordersWithSKUs
  });
});

// @desc Get single order
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('userId assignedStaff');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      ...order.toObject(),
      skus: order.items.map(item => item.sku)
    }
  });
});

// @desc Get all orders
exports.getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('userId assignedStaff')
    .sort('-createdAt');

  const ordersWithSKUs = orders.map(order => ({
    ...order.toObject(),
    skus: order.items.map(item => item.sku)
  }));

  res.status(200).json({
    status: 'success',
    total: orders.length,
    data: ordersWithSKUs
  });
});

// @desc Get order by order number (user-friendly ID)
exports.getOrderByNumber = asyncHandler(async (req, res, next) => {
  const { orderNumber } = req.params;
  
  const order = await Order.findOne({ orderNumber })
    .populate('userId assignedStaff');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      ...order.toObject(),
      skus: order.items.map(item => item.sku)
    }
  });
});

// @desc Update status (Staff: confirmed → processing → packed → out_for_delivery → delivered)
exports.updateStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id).populate('userId');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const allowedStatuses = ['awaiting_payment', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled', 'failed'];

  if (!allowedStatuses.includes(status)) {
    return next(new AppError('Invalid status update', 400));
  }

  // If order is failed, do not allow any status updates
  if (order.orderStatus === 'failed' || order.paymentStatus === 'failed') {
    return next(new AppError('Cannot update status: this order has failed and is closed.', 400));
  }

  // If order is awaiting payment or online payment is pending/not paid, only allow moving to 'failed' or 'cancelled'
  if (order.orderStatus === 'awaiting_payment' || (order.paymentMethod === 'ONLINE' && order.paymentStatus !== 'paid')) {
    if (status !== 'failed' && status !== 'cancelled') {
      return next(new AppError('Cannot activate unpaid order. Only moving to "failed" is allowed for awaiting payment orders.', 400));
    }
  }

  // If status is 'delivered', automatically mark OTP as verified (OTP concept removed for admin/staff)
  if (status === 'delivered') {
    order.deliveryOtpVerified = true;
    order.deliveryOtpVerifiedAt = new Date();
  }

  // If status is 'failed' or 'cancelled', update payment status if unpaid
  if (status === 'failed' || status === 'cancelled') {
    if (order.paymentStatus === 'pending' || order.paymentStatus === 'created') {
      order.paymentStatus = 'failed';
    }
  }

  // If out_for_delivery, assign staff or admin
  if (status === 'out_for_delivery' && req.user && !order.assignedStaff) {
    order.assignedStaff = req.user._id;
  }

  order.orderStatus = status;
  await order.save();

  // Emit socket update for real-time notifications
  emitOrderUpdate(order);
  
  // Trigger Push Notifications, Email, and WhatsApp asynchronously
  notificationManager.handleStatusChange(order, status).catch(console.error);

  res.status(200).json({
    status: 'success',
    data: order
  });
});



// @desc Tracking
exports.getTrackingData = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const mongoose = require('mongoose');
  
  let order;
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    order = await Order.findById(orderId).populate('assignedStaff', 'name phone email');
  }
  
  if (!order) {
    order = await Order.findOne({ trackingCode: orderId }).populate('assignedStaff', 'name phone email');
  }

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      ...order.toObject(),
      skus: order.items.map(item => item.sku)
    }
  });
});

// @desc Download invoice
exports.downloadInvoice = asyncHandler(async (req, res, next) => {
  let order = await Order.findById(req.params.id);
  let isInShop = false;
  if (!order) {
    order = await InShopOrder.findById(req.params.id);
    isInShop = true;
  }

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const isOwner = order.userId && order.userId.toString() === req.user._id.toString();
  const isAdminOrStaff =
    req.user.role === 'admin' || req.user.role === 'staff';

  if (!isInShop && !isOwner && !isAdminOrStaff) {
    return next(new AppError('Unauthorized invoice access', 403));
  }

  const pdfBuffer = await invoiceService.generateInvoiceBuffer(order._id);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=Invoice-${order.orderNumber || 'InShop'}.pdf`
  });

  res.send(pdfBuffer);
});

// ==========================================
// DELIVERY OTP - SEND
// ==========================================
exports.sendDeliveryOtp = asyncHandler(async (req, res, next) => {
  const { channel = 'both' } = req.body || {};
  const order = await Order.findById(req.params.id).populate('userId', 'name email phone');

  if (!order) return next(new AppError('Order not found', 404));

  // Only out_for_delivery orders can have delivery OTP sent
  if (order.orderStatus !== 'out_for_delivery') {
    return next(new AppError(`Delivery OTP can only be sent for orders that are out for delivery. Current status: ${order.orderStatus}`, 400));
  }

  // Already delivered
  if (order.orderStatus === 'delivered') {
    return next(new AppError('Order is already delivered', 400));
  }

  // Resend cooldown (60 seconds)
  if (order.deliveryOtpLastSentAt) {
    const timeSinceLastSent = Date.now() - new Date(order.deliveryOtpLastSentAt).getTime();
    if (timeSinceLastSent < 60000) {
      const waitSeconds = Math.ceil((60000 - timeSinceLastSent) / 1000);
      return next(new AppError(`Please wait ${waitSeconds} seconds before requesting a new OTP`, 429));
    }
  }

  // Get customer phone and email
  const customerPhone = order.address?.phone || order.userId?.phone;
  const customerEmail = order.userId?.email;

  const sendSms = (channel === 'both' || channel === 'sms');
  const sendEmail = (channel === 'both' || channel === 'email');

  if (sendSms && !customerPhone) {
    return next(new AppError('Customer phone number not available for SMS OTP', 400));
  }

  if (sendEmail && !customerEmail) {
    return next(new AppError('Customer email address not available for Email OTP', 400));
  }

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Hash OTP before storing
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);

  // Store hashed OTP with 5-minute expiry, reset attempts
  order.deliveryOtp = hashedOtp;
  order.deliveryOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  order.deliveryOtpVerified = false;
  order.deliveryOtpVerifiedAt = undefined;
  order.deliveryOtpAttempts = 0;
  order.deliveryOtpLastSentAt = new Date();
  await order.save();

  // Send SMS and/or Email depending on selected channel
  const smsPromise = sendSms
    ? smsService.sendDeliveryOtpSMS(customerPhone, otp)
    : Promise.resolve({ success: false, skipped: true });

  const emailPromise = (sendEmail && customerEmail)
    ? emailService.sendDeliveryOtpEmail(customerEmail, otp, order.orderNumber)
    : Promise.resolve({ success: false, skipped: true });

  const [smsResult, emailResult] = await Promise.allSettled([smsPromise, emailPromise]);

  const smsSuccess = sendSms && smsResult.status === 'fulfilled' && smsResult.value?.success;
  const emailSuccess = sendEmail && emailResult.status === 'fulfilled' && emailResult.value?.success;

  if (sendSms && !smsSuccess && sendEmail && !emailSuccess) {
    return res.status(207).json({
      status: 'warning',
      message: 'OTP generated but delivery failed via both SMS and Email. Please try again.',
      smsFailed: true,
      emailFailed: true,
    });
  }

  const channels = [];
  if (smsSuccess) channels.push('SMS');
  if (emailSuccess) channels.push('Email');

  res.status(200).json({
    status: 'success',
    message: `Delivery OTP sent to customer via ${channels.length > 0 ? channels.join(' & ') : (channel.toUpperCase())}`,
    smsSent: smsSuccess,
    emailSent: emailSuccess,
    channel,
  });
});

// ==========================================
// DELIVERY OTP - VERIFY
// ==========================================
exports.verifyDeliveryOtp = asyncHandler(async (req, res, next) => {
  const { otp } = req.body;

  if (!otp || otp.length !== 6) {
    return next(new AppError('Please provide a valid 6-digit OTP', 400));
  }

  const order = await Order.findById(req.params.id).select('+deliveryOtp').populate('userId', 'name email phone');

  if (!order) return next(new AppError('Order not found', 404));

  if (order.orderStatus === 'delivered') {
    return next(new AppError('Order is already delivered', 400));
  }

  if (order.orderStatus !== 'out_for_delivery') {
    return next(new AppError('Order is not out for delivery', 400));
  }

  if (order.deliveryOtpVerified) {
    return next(new AppError('Delivery OTP already verified', 400));
  }

  if (!order.deliveryOtp) {
    return next(new AppError('No delivery OTP has been sent. Please send OTP first.', 400));
  }

  // Check expiry
  if (!order.deliveryOtpExpiresAt || new Date() > new Date(order.deliveryOtpExpiresAt)) {
    return next(new AppError('Delivery OTP has expired. Please send a new OTP.', 400));
  }

  // Check max attempts (5 attempts allowed)
  if (order.deliveryOtpAttempts >= 5) {
    return next(new AppError('Too many incorrect attempts. Please send a new OTP.', 400));
  }

  // Compare OTP with hash
  const isMatch = await bcrypt.compare(otp, order.deliveryOtp);

  if (!isMatch) {
    order.deliveryOtpAttempts = (order.deliveryOtpAttempts || 0) + 1;
    await order.save();
    const remaining = 5 - order.deliveryOtpAttempts;
    return next(new AppError(`Invalid delivery OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`, 400));
  }

  // OTP verified — mark order as delivered
  order.deliveryOtpVerified = true;
  order.deliveryOtpVerifiedAt = new Date();
  order.deliveryOtp = undefined; // Clear the hash after successful verification
  order.orderStatus = 'delivered';
  await order.save();

  // Emit socket update
  emitOrderUpdate(order);

  // Trigger notifications asynchronously
  notificationManager.handleStatusChange(order, 'delivered').catch(console.error);

  res.status(200).json({
    status: 'success',
    message: 'Delivery verified successfully. Order marked as delivered.',
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      deliveryOtpVerifiedAt: order.deliveryOtpVerifiedAt,
    },
  });
});

// Export setIo function for server.js
module.exports.setIo = setIo;