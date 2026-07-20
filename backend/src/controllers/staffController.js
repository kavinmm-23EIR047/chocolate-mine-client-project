const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const Product = require('../models/Product');
const InShopOrder = require('../models/InShopOrder');
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
  confirmed: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],       // terminal state
  cancelled: []        // terminal state
};

// @desc    Staff Dashboard Stats
// @route   GET /api/v1/staff/dashboard
exports.getStaffDashboard = asyncHandler(async (req, res, next) => {
  const [confirmedCount, outForDeliveryOrders, deliveredOrders, inShopOrdersCount] = await Promise.all([
    Order.countDocuments({ orderStatus: 'confirmed' }),
    Order.countDocuments({ orderStatus: 'out_for_delivery' }),
    Order.countDocuments({ orderStatus: 'delivered' }),
    InShopOrder.countDocuments()
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      confirmedOrders: confirmedCount,
      outForDeliveryOrders,
      deliveredOrders,
      inShopOrdersCount
    }
  });
});

// @desc    Get Confirmed Orders (Ready to be managed in kitchen)
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
  const order = await Order.findById(req.params.id).populate('userId', 'name phone');
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (order.kotPrinted) {
    order.kotReprintCount = (order.kotReprintCount || 0) + 1;
  }
  order.kotPrinted = true;
  order.kotPrintedAt = new Date();
  await order.save();

  // Calculate estimated height dynamically to prevent excessive trailing empty space
  let estimatedHeight = 150; // base margins & header metadata
  order.items.forEach(item => {
    estimatedHeight += 30; // item name & qty row
    if (item.selectedFlavor || item.customFlavor) estimatedHeight += 12;
    if (item.selectedWeight || item.customWeight) estimatedHeight += 12;
    
    if (item.isCustomCake && item.customDetails) {
      estimatedHeight += 20; // details divider
      if (item.customDetails.shape) estimatedHeight += 11;
      if (item.customDetails.tiers) estimatedHeight += 11;
      if (item.customDetails.spongeType) estimatedHeight += 11;
      if (item.customDetails.creamColor) estimatedHeight += 11;
      if (item.customDetails.frostingColor) estimatedHeight += 11;
      if (item.customDetails.designTheme) estimatedHeight += 11;
      if (item.customDetails.eggless) estimatedHeight += 11;
      if (item.customDetails.lessSugar) estimatedHeight += 11;
      if (item.customDetails.toppings && item.customDetails.toppings.length > 0) estimatedHeight += 11;
      if (item.customDetails.photoReferenceUrl) estimatedHeight += 11;
      if (item.customDetails.notes) {
        const lineCount = Math.ceil(item.customDetails.notes.length / 32) || 1;
        estimatedHeight += lineCount * 11;
      }
    }
    
    if (item.designImages && (item.designImages.preview || item.designImages.front || item.designImages.top)) {
      estimatedHeight += 15;
      if (item.designImages.preview) estimatedHeight += 11;
      if (item.designImages.front) estimatedHeight += 11;
      if (item.designImages.top) estimatedHeight += 11;
    }
  });

  if (order.customCakePdfUrl) {
    estimatedHeight += 40;
  }

  if (order.cakeMessage || order.notes) {
    estimatedHeight += 25;
    if (order.cakeMessage) {
      const lineCount = Math.ceil(order.cakeMessage.length / 32) || 1;
      estimatedHeight += lineCount * 11;
    }
    if (order.notes) {
      const lineCount = Math.ceil(order.notes.length / 32) || 1;
      estimatedHeight += lineCount * 11;
    }
  }

  estimatedHeight += 50; // footer & padding
  estimatedHeight = Math.max(300, Math.ceil(estimatedHeight)); // minimum height guard

  const doc = new PDFDocument({ margin: 10, size: [226, estimatedHeight] });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {
    const pdfBuffer = Buffer.concat(buffers);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="KOT-${order.kotNumber || order.orderNumber}.pdf"`);
    res.status(200).send(pdfBuffer);
  });

  // Write KOT content to PDF
  doc.font('Courier-Bold').fontSize(12).text('THE CHOCOLATE MINE', { align: 'center' });
  doc.font('Courier').fontSize(8).text('KITCHEN ORDER TICKET (KOT)', { align: 'center' });
  doc.moveDown(0.3);

  doc.font('Courier').fontSize(8).text('-------------------------------------');
  doc.font('Courier-Bold').fontSize(8);
  doc.text(`KOT No   : ${order.kotNumber || 'N/A'}`);
  doc.text(`Order No : ${order.orderNumber || 'N/A'}`);
  doc.text(`Reprint  : ${order.kotReprintCount || 0}`);
  doc.text(`Date     : ${new Date(order.createdAt).toLocaleDateString('en-IN')}`);
  doc.text(`Delivery : ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : 'N/A'} (${order.deliverySlot || 'N/A'})`);
  doc.text(`Customer : ${order.userId?.name || 'N/A'} (${order.userId?.phone || 'N/A'})`);
  doc.font('Courier').fontSize(8).text('-------------------------------------');

  doc.font('Courier-Bold').fontSize(8).text('ITEMS PREPARATION:', { underline: true });
  doc.moveDown(0.2);

  order.items.forEach((item, index) => {
    doc.font('Courier-Bold').fontSize(9).text(`${item.name} x ${item.qty}`);
    if (item.selectedFlavor || item.customFlavor) {
      doc.font('Courier').fontSize(7.5).text(`  Flavour: ${item.selectedFlavor || item.customFlavor}`);
    }
    if (item.selectedWeight || item.customWeight) {
      doc.font('Courier').fontSize(7.5).text(`  Weight : ${item.selectedWeight || item.customWeight}`);
    }
    
    if (item.isCustomCake && item.customDetails) {
      doc.font('Courier-Oblique').fontSize(7);
      doc.text('  -- CUSTOM CAKE DETAILS --');
      if (item.customDetails.shape) doc.text(`  Shape: ${item.customDetails.shape}`);
      if (item.customDetails.tiers) doc.text(`  Tiers: ${item.customDetails.tiers}`);
      if (item.customDetails.spongeType) doc.text(`  Sponge: ${item.customDetails.spongeType}`);
      if (item.customDetails.creamColor) doc.text(`  Cream Color: ${item.customDetails.creamColor}`);
      if (item.customDetails.frostingColor) doc.text(`  Frosting Color: ${item.customDetails.frostingColor}`);
      if (item.customDetails.designTheme) doc.text(`  Theme: ${item.customDetails.designTheme}`);
      if (item.customDetails.eggless) doc.text('  Eggless: Yes');
      if (item.customDetails.lessSugar) doc.text('  Less Sugar: Yes');
      if (item.customDetails.toppings && item.customDetails.toppings.length > 0) doc.text(`  Toppings: ${item.customDetails.toppings.join(', ')}`);
      if (item.customDetails.photoReferenceUrl) doc.text(`  Ref Photo: ${item.customDetails.photoReferenceUrl}`);
      if (item.customDetails.notes) doc.text(`  Notes: ${item.customDetails.notes}`);
    }
    
    if (item.designImages && (item.designImages.preview || item.designImages.front || item.designImages.top)) {
      doc.font('Courier-Oblique').fontSize(7).text('  -- DESIGN IMAGES --');
      if (item.designImages.preview) doc.text(`  Preview: ${item.designImages.preview}`);
      if (item.designImages.front) doc.text(`  Front: ${item.designImages.front}`);
      if (item.designImages.top) doc.text(`  Top: ${item.designImages.top}`);
    }
    doc.moveDown(0.2);
  });

  if (order.customCakePdfUrl) {
    doc.font('Courier').fontSize(8).text('-------------------------------------');
    doc.font('Courier-Bold').fontSize(8).text(`DESIGN PDF:`);
    doc.font('Courier').fontSize(7.5).text(order.customCakePdfUrl);
  }

  if (order.cakeMessage || order.notes) {
    doc.font('Courier').fontSize(8).text('-------------------------------------');
    doc.font('Courier-Bold').fontSize(8).text('INSTRUCTIONS:');
    if (order.cakeMessage) doc.font('Courier').fontSize(7.5).text(`Msg on Cake: ${order.cakeMessage}`);
    if (order.notes) doc.font('Courier').fontSize(7.5).text(`Notes: ${order.notes}`);
  }

  doc.font('Courier').fontSize(8).text('-------------------------------------');
  doc.font('Courier').fontSize(7).text(`Generated: ${new Date(order.kotPrintedAt).toLocaleString('en-IN')}`, { align: 'center' });
  doc.end();
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
// Flow: confirmed → out_for_delivery → delivered
exports.updateKitchenStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id).populate('userId', 'name phone email');
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Validate the status is a known status
  const allStatuses = ['confirmed', 'out_for_delivery', 'delivered', 'cancelled'];
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

// @desc    Create In-Shop Order (walk-in customer, cash payment at counter)
// @route   POST /api/v1/staff/orders/in-shop
exports.createInShopOrder = asyncHandler(async (req, res, next) => {
  const { customerName, customerPhone, items, notes } = req.body;

  // Validate required fields
  if (!customerName || !customerName.trim()) {
    return next(new AppError('Customer name is required', 400));
  }
  if (!customerPhone || !customerPhone.trim()) {
    return next(new AppError('Customer phone is required', 400));
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('At least one item is required', 400));
  }

  // Build order items from the provided data
  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    if (!item.productId || !item.name || !item.qty || item.price === undefined || item.price === null) {
      console.error('❌ Validation failed for item:', item);
      return next(new AppError(`Validation failed for item: ${item.name || 'Unknown'}. Missing required fields.`, 400));
    }

    const itemTotal = Number(item.price) * Number(item.qty);
    subtotal += itemTotal;

    orderItems.push({
      productId: item.productId,
      name: item.name,
      qty: Number(item.qty),
      price: Number(item.price),
      originalPrice: Number(item.price),
      image: item.image || '',
      selectedFlavor: item.selectedFlavor || null,
      selectedWeight: item.selectedWeight || null,
      category: item.category || 'General'
    });
  }

  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  // Create the order
  const order = await InShopOrder.create({
    userId: req.user._id,
    createdByStaff: req.user._id,
    isInShopOrder: true,
    items: orderItems,
    subtotal,
    discount: 0,
    deliveryCharge: 0,
    convenienceFee: 0,
    gst,
    total,
    paymentMethod: 'IN_SHOP',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    address: {
      fullName: customerName.trim(),
      phone: customerPhone.trim(),
      houseNo: 'In-Shop',
      street: 'The Chocolate Mine',
      city: 'Coimbatore',
      pincode: '641001'
    },
    notes: notes || '',
    deliveryDate: new Date(),
    deliverySlot: 'In-Shop Pickup'
  });

  // Emit socket update
  emitOrderUpdate(order);

  res.status(201).json({
    status: 'success',
    message: 'In-shop order created successfully',
    data: order
  });
});

// @desc    Get In-Shop Orders History
// @route   GET /api/v1/staff/orders/in-shop
exports.getInShopOrders = asyncHandler(async (req, res, next) => {
  const orders = await InShopOrder.find()
    .populate('userId', 'name email phone')
    .populate('createdByStaff', 'name phone')
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

// Export setIo function for server.js
module.exports.setIo = setIo;