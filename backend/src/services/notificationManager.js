const User = require('../models/User');
const Notification = require('../models/Notification');
const telegramService = require('./telegramService');
const emailService = require('./emailService');
const socketService = require('./socketService');
const firebaseService = require('./firebaseService');
const whatsappService = require('./whatsappService');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

const isUserOnline = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.lastActiveAt) return false;
  return (Date.now() - new Date(user.lastActiveAt).getTime()) < OFFLINE_THRESHOLD;
};

/**
 * Saves a notification to MongoDB using the strict schema.
 * Extra metadata is serialized into the message string after '|||' to avoid changing the schema.
 */
const saveWebNotification = async (userId, title, message, orderId = null, role = 'user', metadata = {}) => {
  try {
    const formattedMessage = metadata && Object.keys(metadata).length > 0
      ? `${message}|||${JSON.stringify(metadata)}`
      : message;

    await Notification.create({
      userId,
      orderId,
      recipientRole: role,
      type: title, // Stores the title in the required 'type' field
      channel: 'WEB',
      message: formattedMessage,
      status: 'SENT',
      delivered: true,
      sentAt: new Date()
    });
  } catch (err) {
    logger.error('Failed to save WEB notification:', err.message);
  }
};

/**
 * Saves a notification to all admin users.
 */
const saveAdminWebNotification = async (title, message, orderId = null, metadata = {}) => {
  try {
    const admins = await User.find({ role: 'admin' }, '_id');
    for (const admin of admins) {
      await saveWebNotification(admin._id, title, message, orderId, 'admin', metadata);
    }
  } catch (err) {
    logger.error('Failed to save admin WEB notification:', err.message);
  }
};

/**
 * Saves a notification to all active users (broadcast).
 */
const saveBroadcastWebNotification = async (title, message, orderId = null, metadata = {}) => {
  try {
    const users = await User.find({ role: 'user', active: true }, '_id');
    for (const user of users) {
      await saveWebNotification(user._id, title, message, orderId, 'user', metadata);
    }
  } catch (err) {
    logger.error('Failed to save broadcast WEB notification:', err.message);
  }
};

/* ==================================
   USER NOTIFICATIONS
   ================================== */

exports.notifyOrderSuccess = async (order) => {
  try {
    const populatedOrder = await order.populate('userId');

    const trackingNumber = populatedOrder.orderNumber || populatedOrder._id.toString();

    // 1. NOTIFY USER
    socketService.emitToUser(populatedOrder.userId._id, 'order_confirmed', { orderNumber: trackingNumber });
    
    if (populatedOrder.userId.email) {
      emailService.sendOrderConfirmed(populatedOrder.userId.email, populatedOrder)
        .catch(e => logger.error('Order Email Failed:', e.message));
    }
    
    if (populatedOrder.userId.phone) {
      whatsappService.sendOrderPlaced(populatedOrder.userId.phone, trackingNumber);
    }

    const userTitle = '✅ Order Confirmed';
    const userMsg = `Your order #${trackingNumber} has been confirmed.`;
    const userMetadata = {
      type: 'order_confirmed',
      orderId: populatedOrder._id.toString(),
      url: `/account/orders/${populatedOrder._id}`
    };

    // Save history & send FCM to User
    await saveWebNotification(populatedOrder.userId._id, userTitle, userMsg, populatedOrder._id, 'user', userMetadata);
    if (populatedOrder.userId.fcmTokens && populatedOrder.userId.fcmTokens.length > 0) {
      await firebaseService.sendToUser(populatedOrder.userId._id, userTitle, userMsg, userMetadata);
    }

    // 2. NOTIFY ADMINS (Telegram Group Alert)
    const alertLockKey = `alert_lock:order:${populatedOrder._id}`;
    const isAlreadyAlerted = await cacheService.get(alertLockKey);

    if (!isAlreadyAlerted) {
      await cacheService.set(alertLockKey, 'true', 60);
      await telegramService.sendInternalOrderAlert(populatedOrder);
    }

    // 3. EMIT Socket + Push/DB Notification to all admins
    const admins = await User.find({ role: 'admin' });
    
    const adminTitle = '🔔 New Order Received';
    const adminMsg = `Order #${trackingNumber}\nCustomer: ${populatedOrder.address.fullName}\nPhone: ${populatedOrder.address.phone}\nAmount: ₹${populatedOrder.total}`;
    const adminMetadata = {
      type: 'new_order',
      orderId: populatedOrder._id.toString(),
      customerId: populatedOrder.userId._id.toString(),
      customerPhone: populatedOrder.address.phone,
      amount: String(populatedOrder.total),
      url: '/admin/orders'
    };

    // Save notification for each admin in MongoDB
    await saveAdminWebNotification(adminTitle, adminMsg, populatedOrder._id, adminMetadata);

    for (const admin of admins) {
      socketService.emitToAdmin('new_order_alert', { 
        orderId: populatedOrder._id, 
        orderNumber: trackingNumber,
        amount: populatedOrder.total,
        customer: populatedOrder.address.fullName 
      });
    }

    // Send push notification to admins
    await firebaseService.sendToAdmin(adminTitle, adminMsg, adminMetadata);

    // 4. Trigger Custom Cake request alert if order contains custom cake
    const hasCustomCake = populatedOrder.items.some(item => item.isCustomCake);
    if (hasCustomCake) {
      await exports.notifyCustomCakeRequest(populatedOrder.address.fullName);
    }

  } catch (err) {
    logger.error('Notification Manager Error (notifyOrderSuccess):', err.message);
  }
};

exports.handleStatusChange = async (order, status) => {
  try {
    const populatedOrder = await order.populate('userId');
    logger.info(`Status Change Triggered: ${status} for Order ${populatedOrder.orderNumber}`);
    
    if (!populatedOrder.userId) {
      logger.warn(`No user found in Order ${populatedOrder.orderNumber}`);
      return;
    }

    const trackingNumber = populatedOrder.orderNumber || populatedOrder._id.toString();
    const trackingLink = `${process.env.FRONTEND_URL}/account/orders/${populatedOrder._id}`;
    
    // WEB UPDATE
    socketService.emitToUser(populatedOrder.userId._id, 'status_changed', { orderId: populatedOrder._id, status });

    // EMAIL & TELEGRAM PRESERVED FLOWS
    if (status === 'out_for_delivery') {
      if (populatedOrder.userId.email) {
        emailService.sendDispatched(populatedOrder.userId.email, populatedOrder).catch(e => logger.error('Dispatch Email Failed:', e.message));
      }
      await telegramService.sendOutForDelivery(populatedOrder.userId.phone, trackingNumber, trackingLink, populatedOrder.userId._id);
    } else if (status === 'delivered') {
      logger.info(`Processing Delivered Email + Invoice for ${trackingNumber}`);
      const invoiceService = require('./invoiceService');
      await invoiceService.sendInvoiceAfterDelivery(populatedOrder._id, true);
      await telegramService.sendDelivered(populatedOrder.userId.phone, trackingNumber, `${process.env.FRONTEND_URL}/review`, populatedOrder.userId._id);
    }

    // WHATSAPP & PUSH NOTIFICATIONS FOR USER
    let title = '';
    let msg = '';
    let type = 'status_changed';

    if (status === 'preparing') {
      if (populatedOrder.userId.phone) whatsappService.sendPreparing(populatedOrder.userId.phone, trackingNumber);
      title = '👨🍳 Order Preparing';
      msg = `Your order #${trackingNumber} is being prepared.`;
      type = 'order_preparing';
    } else if (status === 'out_for_delivery') {
      if (populatedOrder.userId.phone) whatsappService.sendOutForDelivery(populatedOrder.userId.phone, trackingNumber);
      title = '🚚 Out For Delivery';
      msg = `Your order #${trackingNumber} is on the way.`;
      type = 'out_for_delivery';
    } else if (status === 'delivered') {
      if (populatedOrder.userId.phone) whatsappService.sendDelivered(populatedOrder.userId.phone, trackingNumber);
      title = '🎉 Order Delivered';
      msg = `Your order #${trackingNumber} has been delivered.`;
      type = 'delivered';
    }

    if (title && msg) {
      const userMetadata = {
        type,
        orderId: populatedOrder._id.toString(),
        url: `/account/orders/${populatedOrder._id}`
      };
      await saveWebNotification(populatedOrder.userId._id, title, msg, populatedOrder._id, 'user', userMetadata);
      await firebaseService.sendToUser(populatedOrder.userId._id, title, msg, userMetadata);
    }
  } catch (err) {
    logger.error('Status Notification Error (handleStatusChange):', err.message);
  }
};

exports.notifyOrderCancelled = async (order) => {
  try {
    const populatedOrder = await order.populate('userId');
    const trackingNumber = populatedOrder.orderNumber || populatedOrder._id.toString();

    // 1. Notify User
    const userTitle = '❌ Order Cancelled';
    const userMsg = `Your order #${trackingNumber} has been cancelled.`;
    const userMetadata = {
      type: 'order_cancelled',
      orderId: populatedOrder._id.toString(),
      url: `/account/orders/${populatedOrder._id}`
    };

    await saveWebNotification(populatedOrder.userId._id, userTitle, userMsg, populatedOrder._id, 'user', userMetadata);
    await firebaseService.sendToUser(populatedOrder.userId._id, userTitle, userMsg, userMetadata);

    // 2. Notify Admins
    const adminTitle = '❌ Order Cancelled';
    const adminMsg = `Order #${trackingNumber}\nCustomer: ${populatedOrder.address.fullName}`;
    const adminMetadata = {
      type: 'admin_order_cancelled',
      orderId: populatedOrder._id.toString(),
      url: '/admin/orders'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, populatedOrder._id, adminMetadata);
    await firebaseService.sendToAdmin(adminTitle, adminMsg, adminMetadata);

  } catch (err) {
    logger.error('Error in notifyOrderCancelled:', err.message);
  }
};

/* ==================================
   ADMIN NOTIFICATIONS & BROADCASTS
   ================================== */

exports.notifyPaymentFailure = async (order, reason) => {
  try {
    const populatedOrder = await order.populate('userId');
    const trackingNumber = populatedOrder.orderNumber || populatedOrder._id.toString();

    // 1. NOTIFY USER
    if (populatedOrder.userId) {
      if (populatedOrder.userId.email) {
        emailService.sendUserPaymentFailed(populatedOrder.userId.email, populatedOrder, reason)
          .catch(e => logger.error('User Payment Failed Email Error:', e.message));
      }
      
      if (populatedOrder.userId.phone) {
        whatsappService.sendPaymentFailure(populatedOrder.userId.phone, populatedOrder.total, populatedOrder.address.fullName);
      }

      const userTitle = 'Payment Failed 🔴';
      const userMsg = `Your payment of ₹${populatedOrder.total} for order #${trackingNumber} failed. Please retry.`;
      const userMetadata = {
        type: 'payment_failed',
        orderId: populatedOrder._id.toString(),
        url: `/account/orders/${populatedOrder._id}`
      };

      await saveWebNotification(populatedOrder.userId._id, userTitle, userMsg, populatedOrder._id, 'user', userMetadata);
      await firebaseService.sendToUser(populatedOrder.userId._id, userTitle, userMsg, userMetadata);
    }

    // 2. NOTIFY ADMINS (Preserve Telegram and Email)
    await telegramService.sendAdminPaymentFailure(null, populatedOrder.address.fullName, populatedOrder.total);

    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      if (admin.email) {
        emailService.sendAdminPaymentFailed(admin.email, populatedOrder, reason)
          .catch(e => logger.error('Admin Payment Failed Email Error:', e.message));
      }
      if (admin.phone) {
        whatsappService.sendAdminPaymentFailure(admin.phone, populatedOrder.address.fullName, populatedOrder.total);
      }
    }

    const adminTitle = '⚠️ Payment Failed';
    const adminMsg = `Order #${trackingNumber}\nCustomer: ${populatedOrder.address.fullName}\nAmount: ₹${populatedOrder.total}`;
    const adminMetadata = {
      type: 'admin_payment_failed',
      orderId: populatedOrder._id.toString(),
      customerId: populatedOrder.userId?._id?.toString() || '',
      customerPhone: populatedOrder.address.phone,
      amount: String(populatedOrder.total),
      url: '/admin/orders'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, populatedOrder._id, adminMetadata);
    await firebaseService.sendToAdmin(adminTitle, adminMsg, adminMetadata);

  } catch (err) {
    logger.error('Payment Failure Notification Error:', err.message);
  }
};

exports.notifyPaymentPending = async (order) => {
  try {
    const populatedOrder = await order.populate('userId');
    const trackingNumber = populatedOrder.orderNumber || populatedOrder._id.toString();

    const adminTitle = '⏳ Payment Pending';
    const adminMsg = `Order #${trackingNumber}\nCustomer: ${populatedOrder.address.fullName}`;
    const adminMetadata = {
      type: 'admin_payment_pending',
      orderId: populatedOrder._id.toString(),
      url: '/admin/orders'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, populatedOrder._id, adminMetadata);
    await firebaseService.sendToAdmin(adminTitle, adminMsg, adminMetadata);
  } catch (err) {
    logger.error('Payment Pending Notification Error:', err.message);
  }
};

exports.notifyRefundRequested = async (order) => {
  try {
    const trackingNumber = order.orderNumber || order._id.toString();

    const adminTitle = '💰 Refund Requested';
    const adminMsg = `Order #${trackingNumber}\nAmount: ₹${order.total}`;
    const adminMetadata = {
      type: 'admin_refund_requested',
      orderId: order._id.toString(),
      amount: String(order.total),
      url: '/admin/orders'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, order._id, adminMetadata);
    await firebaseService.sendToAdmin(adminTitle, adminMsg, adminMetadata);
  } catch (err) {
    logger.error('Refund Request Notification Error:', err.message);
  }
};

exports.notifyNewUserRegistration = async (user) => {
  try {
    const adminTitle = '👤 New User Registered';
    const adminMsg = `${user.name}\n${user.phone || 'No phone provided'}`;
    const adminMetadata = {
      type: 'new_user_registration',
      userId: user._id.toString(),
      url: '/admin/users'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, null, adminMetadata);
    await firebaseService.sendToAdmin(adminTitle, adminMsg, adminMetadata);
  } catch (err) {
    logger.error('New User Registration Notification Error:', err.message);
  }
};

exports.notifyContactFormSubmitted = async (customerName) => {
  try {
    const adminTitle = '📩 New Contact Request';
    const adminMsg = `${customerName}`;
    const adminMetadata = {
      type: 'contact_form_submitted',
      url: '/admin/enquiries'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, null, adminMetadata);
    await firebaseService.sendToAdmin(adminTitle, adminMsg, adminMetadata);
  } catch (err) {
    logger.error('Contact Form Notification Error:', err.message);
  }
};

exports.notifyCustomCakeRequest = async (customerName) => {
  try {
    const adminTitle = '🎂 New Custom Cake Request';
    const adminMsg = `${customerName}`;
    const adminMetadata = {
      type: 'custom_cake_request',
      url: '/admin/orders'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, null, adminMetadata);
    await firebaseService.sendToAdmin(adminTitle, adminMsg, adminMetadata);
  } catch (err) {
    logger.error('Custom Cake Notification Error:', err.message);
  }
};

exports.notifyLowStockAlert = async (productName, quantity) => {
  try {
    const adminTitle = '📦 Low Stock Alert';
    const adminMsg = `${productName}\nRemaining: ${quantity}`;
    const adminMetadata = {
      type: 'low_stock_alert',
      url: '/admin/products'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, null, adminMetadata);
    await firebaseService.sendToAdmin(adminTitle, adminMsg, adminMetadata);
  } catch (err) {
    logger.error('Low Stock Notification Error:', err.message);
  }
};

exports.notifyOutOfStockAlert = async (productName) => {
  try {
    const adminTitle = '🚨 Product Out Of Stock';
    const adminMsg = `${productName}`;
    const adminMetadata = {
      type: 'out_of_stock_alert',
      url: '/admin/products'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, null, adminMetadata);
    await firebaseService.sendToAdmin(adminTitle, adminMsg, adminMetadata);
  } catch (err) {
    logger.error('Out of Stock Notification Error:', err.message);
  }
};

/* ==================================
   BROADCAST NOTIFICATIONS
   ================================== */

exports.notifyNewProduct = async (product) => {
  try {
    logger.info(`New Product Notification Triggered: ${product.name}`);
    
    const title = '🎂 New Product Available';
    const msg = `${product.name} is now available.`;
    const metadata = {
      type: 'new_product',
      productId: product._id.toString(),
      url: `/product/${product.slug || product._id}`
    };

    // Save in DB for all active users & send FCM broadcast
    await saveBroadcastWebNotification(title, msg, null, metadata);
    await firebaseService.sendBroadcast(title, msg, metadata);

    // Also check stock immediately in case of low stock
    if (product.stock === false || product.stock === 0) {
      await exports.notifyOutOfStockAlert(product.name);
    } else if (typeof product.stock === 'number' && product.stock <= 5) {
      await exports.notifyLowStockAlert(product.name, product.stock);
    }
  } catch (err) {
    logger.error('New Product Notification Error:', err.message);
  }
};

exports.notifyProductUpdated = async (product) => {
  try {
    logger.info(`Product Update Notification Triggered: ${product.name}`);
    
    // Broadcast via socket to all online users
    socketService.emitToAll('product_updated', {
      productId: product._id,
      name: product.name,
      message: `${product.name} details have been updated!`
    });

    const title = '✨ Product Updated';
    const msg = `${product.name} has been updated.`;
    const metadata = {
      type: 'product_updated',
      productId: product._id.toString(),
      url: `/product/${product.slug || product._id}`
    };

    await saveBroadcastWebNotification(title, msg, null, metadata);
    await firebaseService.sendBroadcast(title, msg, metadata);

    // Also check stock update alerts
    if (product.stock === false || product.stock === 0) {
      await exports.notifyOutOfStockAlert(product.name);
    } else if (typeof product.stock === 'number' && product.stock <= 5) {
      await exports.notifyLowStockAlert(product.name, product.stock);
    }
  } catch (err) {
    logger.error('Product Update Notification Error:', err.message);
  }
};

exports.notifyOfferAdded = async (banner) => {
  try {
    logger.info(`New Offer Notification Triggered: ${banner.title}`);

    const title = '🎉 New Offer Available';
    const msg = `${banner.title}`;
    const metadata = {
      type: 'new_offer',
      url: banner.link || '/offers'
    };

    await saveBroadcastWebNotification(title, msg, null, metadata);
    await firebaseService.sendBroadcast(title, msg, metadata);
  } catch (err) {
    logger.error('Offer Added Notification Error:', err.message);
  }
};

exports.notifyCouponAdded = async (product) => {
  try {
    if (!product.coupon || !product.coupon.code) return;
    logger.info(`New Coupon Notification Triggered: ${product.coupon.code} on ${product.name}`);

    const title = '🏷️ New Coupon Available';
    const msg = `Use coupon ${product.coupon.code}`;
    const metadata = {
      type: 'coupon_added',
      productId: product._id.toString(),
      couponCode: product.coupon.code,
      url: `/product/${product.slug || product._id}`
    };

    await saveBroadcastWebNotification(title, msg, null, metadata);
    await firebaseService.sendBroadcast(title, msg, metadata);
  } catch (err) {
    logger.error('Coupon Added Notification Error:', err.message);
  }
};

/* ==================================
   GENERIC ADMINISTRATIVE HELPERS
   ================================== */

exports.notifyAdminGeneric = async (title, body, payload = {}) => {
  try {
    await saveAdminWebNotification(title, body, null, payload);
    await firebaseService.sendToAdmin(title, body, payload);
  } catch (err) {
    logger.error('Admin Generic Notification Error:', err.message);
  }
};

exports.notifyAdminError = async (title, errorMessage, payload = {}) => {
  try {
    const finalPayload = { ...payload, type: 'system_error' };
    await saveAdminWebNotification(`⚠️ System Error: ${title}`, errorMessage, null, finalPayload);
    await firebaseService.sendToAdmin(`⚠️ System Error: ${title}`, errorMessage, finalPayload);
  } catch (err) {
    logger.error('Admin Error Notification Failed:', err.message);
  }
};
