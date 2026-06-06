const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const whatsappService = require('../services/whatsappService');

// Store io instance (will be set from server.js)
let ioInstance = null;

// Function to set io instance from server
const setIo = (io) => {
  ioInstance = io;
  console.log('✅ Socket.io instance set in staffController');
};

// Helper function to send WhatsApp messages
const sendWhatsAppMsg = async (phoneNumber, message) => {
  try {
    console.log(`📱 Sending WhatsApp to ${phoneNumber}: ${message}`);
    await whatsappService.sendWhatsApp(phoneNumber, message, 'user');
    return true;
  } catch (error) {
    console.error('WhatsApp sending failed:', error);
    return false;
  }
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

// @desc    Staff Dashboard Stats - Updated to show all orders by status
// @route   GET /api/v1/staff/dashboard
exports.getStaffDashboard = asyncHandler(async (req, res, next) => {
  // Count all orders by status (no assignedStaff filter)
  const [confirmedOrders, outForDeliveryOrders, deliveredOrders] = await Promise.all([
    Order.countDocuments({ orderStatus: 'confirmed' }),
    Order.countDocuments({ orderStatus: 'out_for_delivery' }),
    Order.countDocuments({ orderStatus: 'delivered' })
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      confirmedOrders,
      outForDeliveryOrders,
      deliveredOrders
    }
  });
});

// @desc    Get Confirmed Orders (Ready to be picked up) with full product details
// @route   GET /api/v1/staff/orders/new
exports.getNewOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ orderStatus: 'confirmed' })
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

// @desc    Get Out For Delivery Orders with full product details
// @route   GET /api/v1/staff/orders/out-for-delivery
exports.getOutForDeliveryOrders = asyncHandler(async (req, res) => {
  // REMOVED assignedStaff filter - show all out_for_delivery orders
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
  // REMOVED assignedStaff filter - show all delivered orders
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

// @desc    Update Kitchen Status (confirmed → out_for_delivery → delivered)
// @route   PATCH /api/v1/staff/orders/:id/kitchen-status
exports.updateKitchenStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id).populate('userId', 'name phone email');
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const allowedStatuses = ['confirmed', 'out_for_delivery', 'delivered'];
  if (!allowedStatuses.includes(status)) {
    return next(new AppError('Invalid status update', 400));
  }

  // Validate sequential status update
  if (order.orderStatus === 'confirmed' && status !== 'out_for_delivery') {
    return next(new AppError('Confirmed orders can only be updated to out_for_delivery', 400));
  }
  if (order.orderStatus === 'out_for_delivery' && status !== 'delivered') {
    return next(new AppError('Out for delivery orders can only be updated to delivered', 400));
  }
  if (order.orderStatus === 'delivered') {
    return next(new AppError('Delivered orders cannot be updated further', 400));
  }

  let generatedOtp = null;

  // If moving to out_for_delivery, generate OTP and assign staff
  if (status === 'out_for_delivery') {
    generatedOtp = order.generateDeliveryOtp();
    order.assignedStaff = req.user._id;
    await order.save();
    
    // Send OTP via WhatsApp to customer
    const otpMessage = `Your OTP for order ${order.orderNumber} is ${generatedOtp}. Valid for 10 minutes. - The Chocolate Mine`;
    await sendWhatsAppMsg(order.address.phone, otpMessage);
    
    console.log(`📱 OTP sent to ${order.address.phone}: ${generatedOtp}`);
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
    data: responseData,
    ...(generatedOtp && process.env.NODE_ENV === 'development' && { otp: generatedOtp })
  });
});

// @desc    Generate Delivery OTP
// @route   POST /api/v1/staff/orders/:id/generate-otp
exports.generateDeliveryOtp = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Only generate OTP if order is out_for_delivery
  if (order.orderStatus !== 'out_for_delivery') {
    return next(new AppError('OTP can only be generated for out_for_delivery orders', 400));
  }

  const otp = order.generateDeliveryOtp();
  await order.save();

  // Send OTP via WhatsApp to customer
  const otpMessage = `Your OTP for order ${order.orderNumber} is ${otp}. Valid for 10 minutes. - The Chocolate Mine`;
  await sendWhatsAppMsg(order.address.phone, otpMessage);
  
  console.log(`📱 New OTP sent to ${order.address.phone}: ${otp}`);

  res.status(200).json({
    status: 'success',
    message: 'OTP sent to customer successfully',
    otp: process.env.NODE_ENV === 'development' ? otp : undefined
  });
});

// @desc    Verify Delivery OTP
// @route   POST /api/v1/staff/orders/:id/verify-otp
exports.verifyDeliveryOtp = asyncHandler(async (req, res, next) => {
  const { otp } = req.body;
  const order = await Order.findById(req.params.id).populate('userId', 'name phone email');
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Only verify OTP if order is out_for_delivery
  if (order.orderStatus !== 'out_for_delivery') {
    return next(new AppError('Order is not out for delivery', 400));
  }

  const result = order.verifyDeliveryOtp(otp);
  
  if (!result.valid) {
    return next(new AppError(result.message, 400));
  }

  order.orderStatus = 'delivered';
  await order.save();

  // Send confirmation WhatsApp to customer
  const confirmMessage = `Your order ${order.orderNumber} has been delivered successfully! Thank you for choosing The Chocolate Mine.`;
  await sendWhatsAppMsg(order.address.phone, confirmMessage);

  // Emit socket update for real-time notifications
  emitOrderUpdate(order);

  // Trigger push/DB notifications for the user
  try {
    const notificationManager = require('../services/notificationManager');
    notificationManager.handleStatusChange(order, 'delivered').catch(console.error);
  } catch (err) {
    console.error('Failed to trigger handleStatusChange notification:', err);
  }

  res.status(200).json({
    status: 'success',
    message: 'Order delivered successfully',
    data: {
      ...order.toObject(),
      formattedItems: formatOrderItems(order.items)
    }
  });
});

// Export setIo function for server.js
module.exports.setIo = setIo;