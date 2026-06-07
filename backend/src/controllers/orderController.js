const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const cacheService = require('../services/cacheService');
const telegramService = require('../services/telegramService');
const invoiceService = require('../services/invoiceService');
const notificationManager = require('../services/notificationManager');
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

  const allowedStatuses = ['confirmed', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

  if (!allowedStatuses.includes(status)) {
    return next(new AppError('Invalid status update', 400));
  }

  // Status transition map
  const transitions = {
    confirmed: ['processing'],
    processing: ['packed'],
    packed: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
    delivered: [],
    cancelled: []
  };

  const allowed = transitions[order.orderStatus];
  if (!allowed || !allowed.includes(status)) {
    return next(new AppError(
      `Cannot update from "${order.orderStatus}" to "${status}".`,
      400
    ));
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
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const isOwner = order.userId.toString() === req.user._id.toString();
  const isAdminOrStaff =
    req.user.role === 'admin' || req.user.role === 'staff';

  if (!isOwner && !isAdminOrStaff) {
    return next(new AppError('Unauthorized invoice access', 403));
  }

  const pdfBuffer = await invoiceService.generateInvoiceBuffer(order._id);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=Invoice-${order.orderNumber}.pdf`
  });

  res.send(pdfBuffer);
});

// Export setIo function for server.js
module.exports.setIo = setIo;