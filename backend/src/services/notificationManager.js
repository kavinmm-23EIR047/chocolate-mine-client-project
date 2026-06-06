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

    if (populatedOrder.userId.fcmToken) {
      firebaseService.sendPushNotification(
        populatedOrder.userId.fcmToken,
        'Order Confirmed! 🎉',
        `Your order #${populatedOrder.orderNumber} has been received successfully.`
      );
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
      if (admin.fcmToken) adminFcmTokens.push(admin.fcmToken);
    }
    
    // Send Push Notification to all admins
    if (adminFcmTokens.length > 0) {
      firebaseService.sendMulticastPushNotification(
        adminFcmTokens,
        'New Order Received! 💰',
        `Order #${populatedOrder.orderNumber} worth ₹${populatedOrder.total} from ${populatedOrder.address.fullName}`
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

    const trackingLink = `${process.env.FRONTEND_URL}/track/${populatedOrder._id}`;
    
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
    if (status === 'preparing') {
      if (populatedOrder.userId.phone) whatsappService.sendPreparing(populatedOrder.userId.phone, populatedOrder.orderNumber);
      if (populatedOrder.userId.fcmToken) firebaseService.sendPushNotification(populatedOrder.userId.fcmToken, 'Order Preparing 🍰', `We are preparing your order #${populatedOrder.orderNumber}.`);
    } else if (status === 'packed') {
      if (populatedOrder.userId.phone) whatsappService.sendPacked(populatedOrder.userId.phone, populatedOrder.orderNumber);
      if (populatedOrder.userId.fcmToken) firebaseService.sendPushNotification(populatedOrder.userId.fcmToken, 'Order Packed 📦', `Your order #${populatedOrder.orderNumber} is packed and ready.`);
    } else if (status === 'out_for_delivery') {
      if (populatedOrder.userId.phone) whatsappService.sendOutForDelivery(populatedOrder.userId.phone, populatedOrder.orderNumber);
      if (populatedOrder.userId.fcmToken) firebaseService.sendPushNotification(populatedOrder.userId.fcmToken, 'Out For Delivery 🚚', `Your order #${populatedOrder.orderNumber} is on its way!`);
    } else if (status === 'delivered') {
      if (populatedOrder.userId.phone) whatsappService.sendDelivered(populatedOrder.userId.phone, populatedOrder.orderNumber);
      if (populatedOrder.userId.fcmToken) firebaseService.sendPushNotification(populatedOrder.userId.fcmToken, 'Order Delivered 🎉', `Your order #${populatedOrder.orderNumber} has been delivered. Enjoy!`);
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

      if (populatedOrder.userId.fcmToken) {
        firebaseService.sendPushNotification(
          populatedOrder.userId.fcmToken,
          'Payment Failed 🔴',
          `Your payment of ₹${populatedOrder.total} for order #${populatedOrder.orderNumber} failed. Please retry.`
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

      if (admin.fcmToken) {
        adminFcmTokens.push(admin.fcmToken);
      }
    }

    if (adminFcmTokens.length > 0) {
      firebaseService.sendMulticastPushNotification(
        adminFcmTokens,
        'Payment Failed Alert 🔴',
        `Payment of ₹${populatedOrder.total} failed for Order #${populatedOrder.orderNumber} by ${populatedOrder.address.fullName}.`
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
    // We only fetch users who have an fcmToken set to optimize query
    const usersWithTokens = await User.find({ fcmToken: { $exists: true, $ne: null, $ne: '' } }, 'fcmToken');
    const fcmTokens = usersWithTokens.map(user => user.fcmToken);

    if (fcmTokens.length > 0) {
      firebaseService.sendMulticastPushNotification(
        fcmTokens,
        'New Product Alert! 🆕',
        `Check out our new ${product.category || 'item'}: ${product.name} is now available!`
      );
    }
  } catch (err) {
    logger.error('New Product Notification Error:', err.message);
  }
};
