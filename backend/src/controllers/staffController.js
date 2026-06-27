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
  confirmed: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],       // terminal state
  cancelled: []        // terminal state
};

// @desc    Staff Dashboard Stats
// @route   GET /api/v1/staff/dashboard
exports.getStaffDashboard = asyncHandler(async (req, res, next) => {
  const [confirmedCount, outForDeliveryOrders, deliveredOrders] = await Promise.all([
    Order.countDocuments({ orderStatus: 'confirmed' }),
    Order.countDocuments({ orderStatus: 'out_for_delivery' }),
    Order.countDocuments({ orderStatus: 'delivered' })
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      confirmedOrders: confirmedCount,
      outForDeliveryOrders,
      deliveredOrders
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

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>KOT - ${order.kotNumber || order.orderNumber || order._id}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            margin: 10px;
            padding: 0;
            width: 72mm;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
          .subtitle { font-size: 10px; margin-bottom: 10px; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .info-table, .items-table { width: 100%; border-collapse: collapse; }
          .info-table td { padding: 2px 0; vertical-align: top; font-size: 11px; }
          .items-table th, .items-table td { padding: 4px 0; vertical-align: top; }
          .items-table th { border-bottom: 1px dashed #000; font-size: 11px; text-align: left; }
          .item-name { font-weight: bold; font-size: 13px; }
          .item-meta { font-size: 10px; padding-left: 10px; margin-top: 2px; }
          .item-custom { font-size: 10px; padding-left: 10px; font-style: italic; color: #333; margin-top: 2px; }
          .footer { margin-top: 20px; font-size: 9px; text-align: center; }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; text-align: center;">
          <button onclick="window.print()" style="padding: 8px 16px; font-size: 14px; font-family: sans-serif; cursor: pointer; background: #000; color: #fff; border: none; border-radius: 4px;">Print Ticket</button>
        </div>

        <div class="text-center">
          <div class="title">THE CHOCOLATE MINE</div>
          <div class="subtitle">KITCHEN ORDER TICKET (KOT)</div>
        </div>

        <div class="divider"></div>

        <table class="info-table">
          <tr>
            <td class="bold">KOT No:</td>
            <td>${order.kotNumber || 'N/A'}</td>
            <td class="bold">Date:</td>
            <td class="text-right">${new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
          </tr>
          <tr>
            <td class="bold">Order No:</td>
            <td>${order.orderNumber || 'N/A'}</td>
            <td class="bold">Reprint:</td>
            <td class="text-right">${order.kotReprintCount || 0}</td>
          </tr>
          <tr>
            <td class="bold">Delivery:</td>
            <td colspan="3">${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : 'N/A'} (${order.deliverySlot || 'N/A'})</td>
          </tr>
          <tr>
            <td class="bold">Customer:</td>
            <td colspan="3">${order.userId?.name || 'N/A'} (${order.userId?.phone || 'N/A'})</td>
          </tr>
        </table>

        <div class="divider"></div>

        <table class="items-table">
          <thead>
            <tr>
              <th width="80%">ITEM</th>
              <th width="20%" class="text-center">QTY</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>
                  <div class="item-name">${item.name}</div>
                  
                  ${(item.selectedFlavor || item.customFlavor) ? `
                    <div class="item-meta">Flavour: ${item.selectedFlavor || item.customFlavor}</div>
                  ` : ''}
                  
                  ${(item.selectedWeight || item.customWeight) ? `
                    <div class="item-meta">Weight: ${item.selectedWeight || item.customWeight}</div>
                  ` : ''}

                  ${item.isCustomCake && item.customDetails ? `
                    <div class="item-custom">
                      -- CUSTOM CAKE DETAILS --<br/>
                      ${item.customDetails.shape ? `Shape: ${item.customDetails.shape}<br/>` : ''}
                      ${item.customDetails.tiers ? `Tiers: ${item.customDetails.tiers}<br/>` : ''}
                      ${item.customDetails.spongeType ? `Sponge: ${item.customDetails.spongeType}<br/>` : ''}
                      ${item.customDetails.creamColor ? `Cream Color: ${item.customDetails.creamColor}<br/>` : ''}
                      ${item.customDetails.frostingColor ? `Frosting Color: ${item.customDetails.frostingColor}<br/>` : ''}
                      ${item.customDetails.designTheme ? `Theme: ${item.customDetails.designTheme}<br/>` : ''}
                      ${item.customDetails.eggless ? `Eggless: Yes<br/>` : ''}
                      ${item.customDetails.lessSugar ? `Less Sugar: Yes<br/>` : ''}
                      ${item.customDetails.toppings && item.customDetails.toppings.length > 0 ? `Toppings: ${item.customDetails.toppings.join(', ')}<br/>` : ''}
                      ${item.customDetails.notes ? `Custom Notes: ${item.customDetails.notes}<br/>` : ''}
                    </div>
                  ` : ''}
                </td>
                <td class="text-center bold" style="font-size: 14px;">${item.qty}</td>
              </tr>
              <tr><td colspan="2"><div style="border-top: 1px dotted #ccc; margin: 4px 0;"></div></td></tr>
            `).join('')}
          </tbody>
        </table>

        ${(order.cakeMessage || order.notes) ? `
          <div class="divider"></div>
          <div class="bold" style="font-size: 11px; margin-bottom: 4px;">INSTRUCTIONS:</div>
          ${order.cakeMessage ? `<div style="font-size: 11px; margin-bottom: 2px;"><strong>Msg on Cake:</strong> ${order.cakeMessage}</div>` : ''}
          ${order.notes ? `<div style="font-size: 11px;"><strong>Notes:</strong> ${order.notes}</div>` : ''}
        ` : ''}

        <div class="divider"></div>

        <div class="footer">
          Generated at: ${new Date(order.kotPrintedAt).toLocaleString('en-IN')}<br/>
          Thank you!
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
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

// Export setIo function for server.js
module.exports.setIo = setIo;