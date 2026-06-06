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

const saveWebNotification = async (userId, title, message, orderId = null) => {
  try {
    await Notification.create({
      userId,
      orderId,
      recipientRole: 'user',
      type: title,
      channel: 'WEB',
      message,
      status: 'SENT',
      delivered: true,
      sentAt: new Date()
    });
  } catch (err) {
    logger.error('Failed to save WEB notification:', err.message);
  }
};

exports.notifyOrderSuccess = async (order) => {
  try {
    // Ensure order is populated for email
    const populatedOrder = await order.populate('userId');

    // 1. NOTIFY USER (Dashboard & Socket & Email, WhatsApp Disabled)
    socketService.emitToUser(populatedOrder.userId._id, 'order_confirmed', { orderNumber: populatedOrder.orderNumber });
    
    if (populatedOrder.userId.email) {
      emailService.sendOrderConfirmed(populatedOrder.userId.email, populatedOrder)
        .catch(e => logger.error('Order Email Failed:', e.message));
    }
    
    if (populatedOrder.userId.phone) {
      whatsappService.sendOrderPlaced(populatedOrder.userId.phone, populatedOrder.orderNumber);
    }

    if (populatedOrder.userId.fcmTokens && populatedOrder.userId.fcmTokens.length > 0) {
      const title = 'Order Confirmed! 🎉';
      const msg = `Your order #${populatedOrder.orderNumber} has been received successfully.`;
      firebaseService.sendPushNotification(populatedOrder.userId.fcmTokens, title, msg, {
        type: 'order_confirmed',
        orderId: populatedOrder._id.toString(),
        url: `/account/orders/${populatedOrder._id}`
      });
      await saveWebNotification(populatedOrder.userId._id, title, msg, populatedOrder._id);
    } else {
      // Still save history even if push is disabled
      const title = 'Order Confirmed! 🎉';
      const msg = `Your order #${populatedOrder.orderNumber} has been received successfully.`;
      await saveWebNotification(populatedOrder.userId._id, title, msg, populatedOrder._id);
    }

    // 2. NOTIFY ADMINS & STAFF (Deduplicated Telegram Group Alert)
    const alertLockKey = `alert_lock:order:${populatedOrder._id}`;
    const isAlreadyAlerted = await cacheService.get(alertLockKey);

    if (!isAlreadyAlerted) {
      // Set lock for 60 seconds to prevent duplicates from retries/webhooks
      await cacheService.set(alertLockKey, 'true', 60);
      await telegramService.sendInternalOrderAlert(populatedOrder);
    } else {
      logger.info(`Skipping duplicate Telegram alert for Order: ${populatedOrder.orderNumber}`);
    }

    // 3. EMIT DASHBOARD ALERTS (To all admins)
    const admins = await User.find({ role: 'admin' });
    const adminFcmTokens = [];
    
    for (const admin of admins) {
      socketService.emitToAdmin('new_order_alert', { 
        orderId: populatedOrder._id, 
        orderNumber: populatedOrder.orderNumber,
        amount: populatedOrder.total,
        customer: populatedOrder.address.fullName 
      });
      if (admin.fcmTokens && admin.fcmTokens.length > 0) {
        adminFcmTokens.push(...admin.fcmTokens);
      }
    }
    
    // Send Push Notification to all admins
    if (adminFcmTokens.length > 0) {
      firebaseService.sendMulticastPushNotification(
        adminFcmTokens,
        'New Order Received! 💰',
        `Order #${populatedOrder.orderNumber} worth ₹${populatedOrder.total} from ${populatedOrder.address.fullName} for Delivery on ${populatedOrder.deliveryDate ? new Date(populatedOrder.deliveryDate).toLocaleDateString() : 'N/A'}`,
        { type: 'new_order', orderId: populatedOrder._id.toString(), customerName: populatedOrder.address.fullName, url: '/admin/orders' }
      );
    }



  } catch (err) {
    logger.error('Notification Manager Error:', err.message);
  }
};

exports.handleStatusChange = async (order, status) => {
  try {
    const populatedOrder = await order.populate('userId');
    logger.info(`Status Change Triggered: ${status} for Order ${populatedOrder.orderNumber}`);
    
    if (!populatedOrder.userId || !populatedOrder.userId.email) {
      logger.warn(`No email found for user in Order ${populatedOrder.orderNumber}`);
      return;
    }

    const trackingLink = `${process.env.FRONTEND_URL}/account/orders/${populatedOrder._id}`;
    
    // WEB UPDATE
    socketService.emitToUser(populatedOrder.userId._id, 'status_changed', { orderId: populatedOrder._id, status });

    // EMAIL
    if (status === 'out_for_delivery') {
      emailService.sendDispatched(populatedOrder.userId.email, populatedOrder).catch(e => logger.error('Dispatch Email Failed:', e.message));
    } else if (status === 'delivered') {
      logger.info(`Processing Delivered Email + Invoice for ${populatedOrder.orderNumber}`);
      const invoiceService = require('./invoiceService');
      await invoiceService.sendInvoiceAfterDelivery(populatedOrder._id, true); // Force resend for testing
    }

    // WHATSAPP & PUSH NOTIFICATIONS FOR USER
    let title = '';
    let msg = '';
    if (status === 'preparing') {
      if (populatedOrder.userId.phone) whatsappService.sendPreparing(populatedOrder.userId.phone, populatedOrder.orderNumber);
      title = 'Order Preparing 🍰';
      msg = `We are preparing your order #${populatedOrder.orderNumber}.`;
    } else if (status === 'packed') {
      if (populatedOrder.userId.phone) whatsappService.sendPacked(populatedOrder.userId.phone, populatedOrder.orderNumber);
      title = 'Order Packed 📦';
      msg = `Your order #${populatedOrder.orderNumber} is packed and ready.`;
    } else if (status === 'out_for_delivery') {
      if (populatedOrder.userId.phone) whatsappService.sendOutForDelivery(populatedOrder.userId.phone, populatedOrder.orderNumber);
      title = 'Out For Delivery 🚚';
      msg = `Your order #${populatedOrder.orderNumber} is on its way!`;
    } else if (status === 'delivered') {
      if (populatedOrder.userId.phone) whatsappService.sendDelivered(populatedOrder.userId.phone, populatedOrder.orderNumber);
      title = 'Order Delivered 🎉';
      msg = `Your order #${populatedOrder.orderNumber} has been delivered. Enjoy!`;
    }

    if (title && msg) {
      if (populatedOrder.userId.fcmTokens && populatedOrder.userId.fcmTokens.length > 0) {
        firebaseService.sendPushNotification(populatedOrder.userId.fcmTokens, title, msg, {
          type: 'status_changed',
          orderId: populatedOrder._id.toString(),
          url: `/account/orders/${populatedOrder._id}`
        });
      }
      await saveWebNotification(populatedOrder.userId._id, title, msg, populatedOrder._id);
    }

    // INTERNAL ALERTS
    if (status === 'out_for_delivery') {
      await telegramService.sendOutForDelivery(populatedOrder.userId.phone, populatedOrder.orderNumber, trackingLink, populatedOrder.userId._id);
    } else if (status === 'delivered') {
      await telegramService.sendDelivered(populatedOrder.userId.phone, populatedOrder.orderNumber, `${process.env.FRONTEND_URL}/review`, populatedOrder.userId._id);
    }
  } catch (err) {
    logger.error('Status Notification Error:', err.message);
  }
};

exports.notifyPaymentFailure = async (order, reason) => {
  try {
    const populatedOrder = await order.populate('userId');
    logger.info(`Payment Failure Notification Triggered for Order ${populatedOrder.orderNumber}`);

    // 1. NOTIFY USER
    if (populatedOrder.userId) {
      if (populatedOrder.userId.email) {
        emailService.sendUserPaymentFailed(populatedOrder.userId.email, populatedOrder, reason)
          .catch(e => logger.error('User Payment Failed Email Error:', e.message));
      }
      
      if (populatedOrder.userId.phone) {
        whatsappService.sendPaymentFailure(populatedOrder.userId.phone, populatedOrder.total, populatedOrder.address.fullName);
      }

      if (populatedOrder.userId.fcmTokens && populatedOrder.userId.fcmTokens.length > 0) {
        firebaseService.sendPushNotification(
          populatedOrder.userId.fcmTokens,
          'Payment Failed 🔴',
          `Your payment of ₹${populatedOrder.total} for order #${populatedOrder.orderNumber} failed. Please retry.`,
          { type: 'payment_failed', orderId: populatedOrder._id.toString(), url: `/account/orders/${populatedOrder._id}` }
        );
      }
    }

    // 2. NOTIFY ADMINS (Email, Telegram, WhatsApp, Push)
    const admins = await User.find({ role: 'admin' });
    const adminFcmTokens = [];

    // Telegram group alert
    await telegramService.sendAdminPaymentFailure(null, populatedOrder.address.fullName, populatedOrder.total);

    for (const admin of admins) {
      // Admin Email
      if (admin.email) {
        emailService.sendAdminPaymentFailed(admin.email, populatedOrder, reason)
          .catch(e => logger.error('Admin Payment Failed Email Error:', e.message));
      }

      // Admin WhatsApp
      if (admin.phone) {
        whatsappService.sendAdminPaymentFailure(admin.phone, populatedOrder.address.fullName, populatedOrder.total);
      }

      if (admin.fcmTokens && admin.fcmTokens.length > 0) {
        adminFcmTokens.push(...admin.fcmTokens);
      }
    }

    if (adminFcmTokens.length > 0) {
      firebaseService.sendMulticastPushNotification(
        adminFcmTokens,
        'Payment Failed Alert 🔴',
        `Payment of ₹${populatedOrder.total} failed for Order #${populatedOrder.orderNumber} by ${populatedOrder.address.fullName}.`,
        { type: 'payment_failed', orderId: populatedOrder._id.toString(), url: '/admin/orders' }
      );
    }

emailService.sendOrderConfirmed(populatedOrder.userId.email, populatedOrder)
        .catch(e => logger.error('Order Email Failed:', e.message));
    }
    
    if (populatedOrder.userId.phone) {
      whatsappService.sendOrderPlaced(populatedOrder.userId.phone, populatedOrder.orderNumber);
    }

    if (populatedOrder.userId.fcmTokens && populatedOrder.userId.fcmTokens.length > 0) {
      const title = 'Order Confirmed! 🎉';
      const msg = `Your order #${populatedOrder.orderNumber} has been received successfully.`;
      firebaseService.sendPushNotification(populatedOrder.userId.fcmTokens, title, msg, {
        type: 'order_confirmed',
        orderId: populatedOrder._id.toString(),
        url: `/account/orders/${populatedOrder._id}`
      });
      await saveWebNotification(populatedOrder.userId._id, title, msg, populatedOrder._id);
    } else {
      // Still save history even if push is disabled
      const title = 'Order Confirmed! 🎉';
      const msg = `Your order #${populatedOrder.orderNumber} has been received successfully.`;
      await saveWebNotification(populatedOrder.userId._id, title, msg, populatedOrder._id);
    }

    // 2. NOTIFY ADMINS & STAFF (Deduplicated Telegram Group Alert)
    const alertLockKey = `alert_lock:order:${populatedOrder._id}`;
    const isAlreadyAlerted = await cacheService.get(alertLockKey);

    if (!isAlreadyAlerted) {
      // Set lock for 60 seconds to prevent duplicates from retries/webhooks
      await cacheService.set(alertLockKey, 'true', 60);
      await telegramService.sendInternalOrderAlert(populatedOrder);
    } else {
      logger.info(`Skipping duplicate Telegram alert for Order: ${populatedOrder.orderNumber}`);
    }

    // 3. EMIT DASHBOARD ALERTS (To all admins)
    const admins = await User.find({ role: 'admin' });
    const adminFcmTokens = [];
    
    for (const admin of admins) {
      socketService.emitToAdmin('new_order_alert', { 
        orderId: populatedOrder._id, 
        orderNumber: populatedOrder.orderNumber,
        amount: populatedOrder.total,
        customer: populatedOrder.address.fullName 
      });
      if (admin.fcmTokens && admin.fcmTokens.length > 0) {
        adminFcmTokens.push(...admin.fcmTokens);
      }
    }
    
    // Send Push Notification to all admins
    if (adminFcmTokens.length > 0) {
      firebaseService.sendMulticastPushNotification(
        adminFcmTokens,
        'New Order Received! 💰',
        `Order #${populatedOrder.orderNumber} worth ₹${populatedOrder.total} from ${populatedOrder.address.fullName} for Delivery on ${populatedOrder.deliveryDate ? new Date(populatedOrder.deliveryDate).toLocaleDateString() : 'N/A'}`,
        { type: 'new_order', orderId: populatedOrder._id.toString(), customerName: populatedOrder.address.fullName, url: '/admin/orders' }
      );
    }



  } catch (err) {
    logger.error('Notification Manager Error:', err.message);
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

    const trackingLink = `${process.env.FRONTEND_URL}/account/orders/${populatedOrder._id}`;
    
    // WEB UPDATE
    socketService.emitToUser(populatedOrder.userId._id, 'status_changed', { orderId: populatedOrder._id, status });

    // EMAIL
    if (status === 'out_for_delivery') {
      if (populatedOrder.userId.email) {
        emailService.sendDispatched(populatedOrder.userId.email, populatedOrder).catch(e => logger.error('Dispatch Email Failed:', e.message));
      }
    } else if (status === 'delivered') {
      logger.info(`Processing Delivered Email + Invoice for ${populatedOrder.orderNumber}`);
      const invoiceService = require('./invoiceService');
      await invoiceService.sendInvoiceAfterDelivery(populatedOrder._id, true); // Force resend for testing
    }

    // WHATSAPP & PUSH NOTIFICATIONS FOR USER
    let title = '';
    let msg = '';
    if (status === 'preparing') {
      if (populatedOrder.userId.phone) whatsappService.sendPreparing(populatedOrder.userId.phone, populatedOrder.orderNumber);
      title = 'Order Preparing 🍰';
      msg = `We are preparing your order #${populatedOrder.orderNumber}.`;
    } else if (status === 'packed') {
      if (populatedOrder.userId.phone) whatsappService.sendPacked(populatedOrder.userId.phone, populatedOrder.orderNumber);
      title = 'Order Packed 📦';
      msg = `Your order #${populatedOrder.orderNumber} is packed and ready.`;
    } else if (status === 'out_for_delivery') {
      if (populatedOrder.userId.phone) whatsappService.sendOutForDelivery(populatedOrder.userId.phone, populatedOrder.orderNumber);
      title = 'Out For Delivery 🚚';
      msg = `Your order #${populatedOrder.orderNumber} is on its way!`;
    } else if (status === 'delivered') {
      if (populatedOrder.userId.phone) whatsappService.sendDelivered(populatedOrder.userId.phone, populatedOrder.orderNumber);
      title = 'Order Delivered 🎉';
      msg = `Your order #${populatedOrder.orderNumber} has been delivered. Enjoy!`;
    }

    if (title && msg) {
      if (populatedOrder.userId.fcmTokens && populatedOrder.userId.fcmTokens.length > 0) {
        firebaseService.sendPushNotification(populatedOrder.userId.fcmTokens, title, msg, {
          type: 'status_changed',
          orderId: populatedOrder._id.toString(),
          url: `/account/orders/${populatedOrder._id}`
        });
      }
      await saveWebNotification(populatedOrder.userId._id, title, msg, populatedOrder._id);
    }

    // INTERNAL ALERTS
    if (status === 'out_for_delivery') {
      await telegramService.sendOutForDelivery(populatedOrder.userId.phone, populatedOrder.orderNumber, trackingLink, populatedOrder.userId._id);
    } else if (status === 'delivered') {
      await telegramService.sendDelivered(populatedOrder.userId.phone, populatedOrder.orderNumber, `${process.env.FRONTEND_URL}/review`, populatedOrder.userId._id);
    }
  } catch (err) {
    logger.error('Status Notification Error:', err.message);
  }
};

exports.notifyPaymentFailure = async (order, reason) => {
  try {
    const populatedOrder = await order.populate('userId');
    logger.info(`Payment Failure Notification Triggered for Order ${populatedOrder.orderNumber}`);

    // 1. NOTIFY USER
    if (populatedOrder.userId) {
      if (populatedOrder.userId.email) {
        emailService.sendUserPaymentFailed(populatedOrder.userId.email, populatedOrder, reason)
          .catch(e => logger.error('User Payment Failed Email Error:', e.message));
      }
      
      if (populatedOrder.userId.phone) {
        whatsappService.sendPaymentFailure(populatedOrder.userId.phone, populatedOrder.total, populatedOrder.address.fullName);
      }

      if (populatedOrder.userId.fcmTokens && populatedOrder.userId.fcmTokens.length > 0) {
        firebaseService.sendPushNotification(
          populatedOrder.userId.fcmTokens,
          'Payment Failed 🔴',
          `Your payment of ₹${populatedOrder.total} for order #${populatedOrder.orderNumber} failed. Please retry.`,
          { type: 'payment_failed', orderId: populatedOrder._id.toString(), url: `/account/orders/${populatedOrder._id}` }
        );
      }
    }

    // 2. NOTIFY ADMINS (Email, Telegram, WhatsApp, Push)
    const admins = await User.find({ role: 'admin' });
    const adminFcmTokens = [];

    // Telegram group alert
    await telegramService.sendAdminPaymentFailure(null, populatedOrder.address.fullName, populatedOrder.total);

    for (const admin of admins) {
      // Admin Email
      if (admin.email) {
        emailService.sendAdminPaymentFailed(admin.email, populatedOrder, reason)
          .catch(e => logger.error('Admin Payment Failed Email Error:', e.message));
      }

      // Admin WhatsApp
      if (admin.phone) {
        whatsappService.sendAdminPaymentFailure(admin.phone, populatedOrder.address.fullName, populatedOrder.total);
      }

      if (admin.fcmTokens && admin.fcmTokens.length > 0) {
        adminFcmTokens.push(...admin.fcmTokens);
      }
    }

    if (adminFcmTokens.length > 0) {
      firebaseService.sendMulticastPushNotification(
        adminFcmTokens,
        'Payment Failed Alert 🔴',
        `Payment of ₹${populatedOrder.total} failed for Order #${populatedOrder.orderNumber} by ${populatedOrder.address.fullName}.`,
        { type: 'payment_failed', orderId: populatedOrder._id.toString(), url: '/admin/orders' }
      );
    }

  } catch (err) {
    logger.error('Payment Failure Notification Manager Error:', err.message);
  }
};

exports.notifyNewProduct = async (product) => {
  try {
    logger.info(`New Product Notification Triggered: ${product.name}`);
    
    // NOTIFY ALL USERS (who have FCM Tokens)
    const usersWithTokens = await User.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } }, 'fcmTokens');
    const fcmTokens = usersWithTokens.flatMap(user => user.fcmTokens);

    if (fcmTokens.length > 0) {
      firebaseService.sendMulticastPushNotification(
        fcmTokens,
        'New Product Alert! 🆕',
        `Check out our new ${product.category || 'item'}: ${product.name} is now available!`,
        { type: 'new_product', url: `/menu` }
      );
    }
  } catch (err) {
    logger.error('New Product Notification Error:', err.message);
  }
};

exports.notifyProductUpdated = async (product) => {
  try {
    logger.info(`Product Update Notification Triggered: ${product.name}`);
    
    // Broadcast via socket to all online users (if applicable)
    socketService.emitToAll('product_updated', {
      productId: product._id,
      name: product.name,
      message: `${product.name} details have been updated!`
    });

    // NOTIFY ALL USERS (who have FCM Tokens)
    const usersWithTokens = await User.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } }, 'fcmTokens');
    const fcmTokens = usersWithTokens.flatMap(user => user.fcmTokens);

    if (fcmTokens.length > 0) {
      firebaseService.sendMulticastPushNotification(
        fcmTokens,
        'Product Update Alert! 🔔',
        `Details for ${product.name} have been updated. Check it out!`,
        { type: 'product_updated', url: `/product/${product.slug}` }
      );
    }
  } catch (err) {
    logger.error('Product Update Notification Error:', err.message);
  }
};

exports.notifyAdminGeneric = async (title, body, payload = {}) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const adminFcmTokens = [];
    for (const admin of admins) {
      if (admin.fcmTokens && admin.fcmTokens.length > 0) {
        adminFcmTokens.push(...admin.fcmTokens);
      }
    }
    if (adminFcmTokens.length > 0) {
      firebaseService.sendMulticastPushNotification(adminFcmTokens, title, body, payload);
    }
  } catch (err) {
    logger.error('Admin Generic Notification Error:', err.message);
  }
};

exports.notifyAdminError = async (title, errorMessage, payload = {}) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const adminFcmTokens = [];
    for (const admin of admins) {
      if (admin.fcmTokens && admin.fcmTokens.length > 0) {
        adminFcmTokens.push(...admin.fcmTokens);
      }
    }
    if (adminFcmTokens.length > 0) {
      const finalPayload = { ...payload, type: 'system_error' };
      firebaseService.sendMulticastPushNotification(adminFcmTokens, `⚠️ System Error: ${title}`, errorMessage, finalPayload);
    }
  } catch (err) {
    logger.error('Admin Error Notification Failed:', err.message);
  }
};
