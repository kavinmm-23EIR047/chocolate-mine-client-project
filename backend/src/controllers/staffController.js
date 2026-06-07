const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Store io instance (will be set from server.js)
let ioInstance = null;

// Function to set io instance from server
const setIo = (io) => {
  ioInstance = io;
  console.log('✅ Socket.io instance set in staffController');
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
    updatedAt: order.updatedAt,
    order: order.toObject()
  });
  
  // Emit to user room
  if (order.userId) {
    const userId = typeof order.userId === 'object' ? order.userId._id : order.userId;
    ioInstance.to(`user_${userId}`).emit('my_order_updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      updatedAt: order.updatedAt
    });
    ioInstance.to(`user_${userId}`).emit('orders_needs_refresh');
  }
  
  // Emit to admin room
  ioInstance.to('admin_room').emit('order_status_updated', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.orderStatus,
    updatedAt: order.updatedAt,
    customerName: order.address?.fullName,
    customerPhone: order.address?.phone
  });
  ioInstance.to('admin_room').emit('dashboard_needs_refresh');
  
  // Emit to staff room if assigned
  if (order.assignedStaff) {
    ioInstance.to(`staff_${order.assignedStaff}`).emit('assigned_order_updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      updatedAt: order.updatedAt
    });
    ioInstance.to(`staff_${order.assignedStaff}`).emit('dashboard_needs_refresh');
  }
  
  // Broadcast general order status update
  ioInstance.emit('order_status_changed', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.orderStatus,
    updatedAt: order.updatedAt
  });
  
  console.log(`📡 Socket: Order ${order.orderNumber} status = ${order.orderStatus}`);
};

// Helper to format order items for display with full product details
const formatOrderItems = (items) => {
  return items.map(item => ({
    id: item._id,
    name: item.name,
    qty: item.qty,
    price: item.price,
    originalPrice: item.originalPrice,
    totalPrice: item.price * item.qty,
    sku: item.sku,
    image: item.image,
    selectedFlavor: item.selectedFlavor || null,
    selectedWeight: item.selectedWeight || null,
    customFlavor: item.customFlavor || null,
    customWeight: item.customWeight || null,
    isCustomCake: item.isCustomCake || false,
    couponCode: item.couponCode || null,
    discountAmount: item.discountAmount || 0,
    customDetails: item.customDetails ? {
      flavour: item.customDetails.flavour,
      shape: item.customDetails.shape,
      tiers: item.customDetails.tiers,
      weight: item.customDetails.weight,
      spongeType: item.customDetails.spongeType,
      creamColor: item.customDetails.creamColor,
      frostingColor: item.customDetails.frostingColor,
      designTheme: item.customDetails.designTheme,
      toppings: item.customDetails.toppings,
      messageOnCake: item.customDetails.messageOnCake,
      candleRequired: item.customDetails.candleRequired,
      knifeIncluded: item.customDetails.knifeIncluded,
      eggless: item.customDetails.eggless,
      lessSugar: item.customDetails.lessSugar,
      notes: item.customDetails.notes
    } : null
  }));
};

// Status transition map: current status → allowed next statuses
const STATUS_TRANSITIONS = {
  confirmed: ['processing'],
  processing: ['packed'],
  packed: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],       // terminal state
  cancelled: []        // terminal state
};

// @desc    Staff Dashboard Stats
// @route   GET /api/v1/staff/dashboard
exports.getStaffDashboard = asyncHandler(async (req, res, next) => {
  const [confirmedCount, processingCount, packedCount, outForDeliveryOrders, deliveredOrders] = await Promise.all([
    Order.countDocuments({ orderStatus: 'confirmed' }),
    Order.countDocuments({ orderStatus: 'processing' }),
    Order.countDocuments({ orderStatus: 'packed' }),
    Order.countDocuments({ orderStatus: 'out_for_delivery' }),
    Order.countDocuments({ orderStatus: 'delivered' })
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      confirmedOrders: confirmedCount + processingCount + packedCount,
      outForDeliveryOrders,
      deliveredOrders
    }
  });
});

// @desc    Get Confirmed/Processing/Packed Orders (Ready to be managed in kitchen)
// @route   GET /api/v1/staff/orders/new
exports.getNewOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ orderStatus: { $in: ['confirmed', 'processing', 'packed'] } })
    .populate('userId', 'name phone email')
    .sort('-createdAt');

  const formattedOrders = orders.map(order => ({
    ...order.toObject(),
    formattedItems: formatOrderItems(order.items),
    itemsCount: order.items.length,
    totalItems: order.items.reduce((sum, item) => sum + item.qty, 0)
  }));

  res.status(200).json({
    status: 'success',
    count: orders.length,
    data: formattedOrders
  });
});

// @desc    Get Processing Orders
// @route   GET /api/v1/staff/orders/processing
exports.getProcessingOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ orderStatus: 'processing' })
    .populate('userId', 'name phone email')
    .sort('-createdAt');

  const formattedOrders = orders.map(order => ({
    ...order.toObject(),
    formattedItems: formatOrderItems(order.items),
    itemsCount: order.items.length,
    totalItems: order.items.reduce((sum, item) => sum + item.qty, 0)
  }));

  res.status(200).json({
    status: 'success',
    count: orders.length,
    data: formattedOrders
  });
});

// @desc    Get Packed Orders
// @route   GET /api/v1/staff/orders/packed
exports.getPackedOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ orderStatus: 'packed' })
    .populate('userId', 'name phone email')
    .sort('-createdAt');

  const formattedOrders = orders.map(order => ({
    ...order.toObject(),
    formattedItems: formatOrderItems(order.items),
    itemsCount: order.items.length,
    totalItems: order.items.reduce((sum, item) => sum + item.qty, 0)
  }));

  res.status(200).json({
    status: 'success',
    count: orders.length,
    data: formattedOrders
  });
});

// @desc    Get Out For Delivery Orders
// @route   GET /api/v1/staff/orders/out-for-delivery
exports.getOutForDeliveryOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ 
    orderStatus: 'out_for_delivery'
  })
    .populate('userId', 'name phone email')
    .sort('-createdAt');

  const formattedOrders = orders.map(order => ({
    ...order.toObject(),
    formattedItems: formatOrderItems(order.items),
    itemsCount: order.items.length,
    totalItems: order.items.reduce((sum, item) => sum + item.qty, 0)
  }));

  res.status(200).json({
    status: 'success',
    count: orders.length,
    data: formattedOrders
  });
});

// @desc    Get Delivered Orders
// @route   GET /api/v1/staff/orders/delivered
exports.getDeliveredOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ 
    orderStatus: 'delivered'
  })
    .populate('userId', 'name phone email')
    .sort('-createdAt');

  const formattedOrders = orders.map(order => ({
    ...order.toObject(),
    formattedItems: formatOrderItems(order.items),
    itemsCount: order.items.length,
    totalItems: order.items.reduce((sum, item) => sum + item.qty, 0)
  }));

  res.status(200).json({
    status: 'success',
    count: orders.length,
    data: formattedOrders
  });
});

// @desc    Get Single Order Details for Staff (Full Details)
// @route   GET /api/v1/staff/orders/:id
exports.getOrderDetails = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('userId', 'name phone email')
    .populate('assignedStaff', 'name phone');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const orderDetails = {
    ...order.toObject(),
    formattedItems: formatOrderItems(order.items),
    skus: order.items.map(item => item.sku),
    itemsCount: order.items.length,
    totalItems: order.items.reduce((sum, item) => sum + item.qty, 0),
    paymentBreakdown: {
      subtotal: order.subtotal,
      discount: order.discount,
      deliveryCharge: order.deliveryCharge,
      convenienceFee: order.convenienceFee,
      gst: order.gst,
      total: order.total
    }
  };

  res.status(200).json({
    status: 'success',
    data: orderDetails
  });
});

// @desc    Get KOT Data
// @route   GET /api/v1/staff/orders/:id/kot
exports.getKOTData = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: order
  });
});

// @desc    Print KOT
// @route   GET /api/v1/staff/orders/:id/kot/print
exports.printKOT = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  order.kotPrinted = true;
  order.kotPrintedAt = new Date();
  await order.save();

  res.status(200).json({
    status: 'success',
    data: order
  });
});

// @desc    Mark KOT as Printed
// @route   PATCH /api/v1/staff/orders/:id/print-kot
exports.markKOTPrinted = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  order.kotPrinted = true;
  order.kotPrintedAt = new Date();
  await order.save();

  res.status(200).json({
    status: 'success',
    data: order
  });
});

// @desc    Update Order Status (smooth sequential transition, NO OTP)
// @route   PATCH /api/v1/staff/orders/:id/kitchen-status
// Flow: confirmed → processing → packed → out_for_delivery → delivered
exports.updateKitchenStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id).populate('userId', 'name phone email');
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Validate the status is a known status
  const allStatuses = ['confirmed', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!allStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  // Validate sequential transition
  const allowed = STATUS_TRANSITIONS[order.orderStatus];
  if (!allowed || !allowed.includes(status)) {
    return next(new AppError(
      `Cannot update from "${order.orderStatus}" to "${status}". Allowed: ${(allowed || []).join(', ') || 'none (terminal state)'}`,
      400
    ));
  }

  // If out_for_delivery, assign staff
  if (status === 'out_for_delivery') {
    order.assignedStaff = req.user._id;
  }

  order.orderStatus = status;
  await order.save();

  // Emit socket update for real-time notifications
  emitOrderUpdate(order);

  // Trigger push/DB notifications for the user
  try {
    const notificationManager = require('../services/notificationManager');
    notificationManager.handleStatusChange(order, status).catch(console.error);
  } catch (err) {
    console.error('Failed to trigger handleStatusChange notification:', err);
  }

  // Return formatted response with order details
  const responseData = {
    ...order.toObject(),
    formattedItems: formatOrderItems(order.items),
    itemsCount: order.items.length,
    totalItems: order.items.reduce((sum, item) => sum + item.qty, 0)
  };

  res.status(200).json({
    status: 'success',
    data: responseData
  });
});

// Export setIo function for server.js
module.exports.setIo = setIo;