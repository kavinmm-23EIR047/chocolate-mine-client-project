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
 * Saves a notification to MongoDB and triggers FCM push notifications to the user.
 */
const saveWebNotification = async (userId, title, message, type = 'general', metadata = {}) => {
  try {
    const orderId = metadata.orderId || null;

    // Create DB notification
    const notification = await Notification.create({
      userId,
      orderId,
      recipientRole: 'user',
      title,
      type,
      channel: 'WEB',
      message,
      data: metadata,
      isRead: false,
      opened: false,
      status: 'SENT',
      delivered: true,
      sentAt: new Date()
    });

    // Emit socket notification
    socketService.emitToUser(userId, 'new_notification', {
      _id: notification._id,
      title,
      message,
      type,
      data: metadata,
      createdAt: notification.createdAt
    });

    // Send FCM push notification
    await firebaseService.sendToUser(userId, title, message, metadata);
  } catch (err) {
    logger.error('Failed to save/send WEB notification:', err.message);
  }
};

/**
 * Saves a notification to all admin users in MongoDB and sends FCM to all admin devices.
 */
const saveAdminWebNotification = async (title, message, type = 'admin_general', metadata = {}) => {
  try {
    const orderId = metadata.orderId || null;
    const admins = await User.find({ role: 'admin' }, '_id');
    
    // Save DB records for each admin (so they have individual read status)
    for (const admin of admins) {
      const notification = await Notification.create({
        userId: admin._id,
        orderId,
        recipientRole: 'admin',
        title,
        type,
        channel: 'WEB',
        message,
        data: metadata,
        isRead: false,
        opened: false,
        status: 'SENT',
        delivered: true,
        sentAt: new Date()
      });

      // Emit socket event individually to each admin's room
      socketService.emitToUser(admin._id, 'new_notification', {
        _id: notification._id,
        title,
        message,
        type,
        data: metadata,
        createdAt: notification.createdAt
      });
    }

    // Send FCM multicast to all admin devices
    await firebaseService.sendToAdmin(title, message, metadata);
  } catch (err) {
    logger.error('Failed to save/send admin WEB notification:', err.message);
  }
};

/**
 * Saves a notification to all active users in MongoDB (broadcast) and sends FCM broadcast.
 */
const saveBroadcastWebNotification = async (title, message, type = 'broadcast', metadata = {}) => {
  try {
    const users = await User.find({ role: 'user', active: true }, '_id');
    
    // Save DB record for each user
    for (const user of users) {
      const notification = await Notification.create({
        userId: user._id,
        recipientRole: 'user',
        title,
        type,
        channel: 'WEB',
        message,
        data: metadata,
        isRead: false,
        opened: false,
        status: 'SENT',
        delivered: true,
        sentAt: new Date()
      });

      // Emit socket event individually to each user's room
      socketService.emitToUser(user._id, 'new_notification', {
        _id: notification._id,
        title,
        message,
        type,
        data: metadata,
        createdAt: notification.createdAt
      });
    }

    // Send FCM broadcast
    await firebaseService.sendBroadcast(title, message, metadata);
  } catch (err) {
    logger.error('Failed to save/send broadcast WEB notification:', err.message);
  }
};

/* ==================================
   USER NOTIFICATIONS
   ================================== */

exports.notifyOrderSuccess = async (order) => {
  try {
    const populatedOrder = await order.populate('userId');
    const trackingNumber = populatedOrder.orderNumber || populatedOrder._id.toString();

    // ✅ FIXED: Send detailed WhatsApp to customer with FULL ORDER OBJECT
    if (populatedOrder.userId.phone) {
      await whatsappService.sendOrderPlaced(
        populatedOrder.userId.phone, 
        trackingNumber, 
        populatedOrder  // Pass the complete order object for detailed template
      );
    }

    // ✅ FIXED: Send detailed WhatsApp to admin with FULL ORDER OBJECT
    const adminPhone = process.env.ADMIN_PHONE || '9363265477';
    await whatsappService.sendInternalOrderAlert(adminPhone, populatedOrder);

    // 1. NOTIFY USER (SOCKET, EMAIL)
    socketService.emitToUser(populatedOrder.userId._id, 'order_confirmed', { orderNumber: trackingNumber });
    
    if (populatedOrder.userId.email) {
      emailService.sendOrderConfirmed(populatedOrder.userId.email, populatedOrder)
        .catch(e => logger.error('Order Email Failed:', e.message));
    }

    // Send Dedicated Admin Order Alert Email to Admin
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'thechocolateminercm@gmail.com';
    emailService.sendAdminNewOrderAlert(adminEmail, populatedOrder)
      .catch(e => logger.error('Admin Order Alert Email Failed:', e.message));

    const userTitle = '✅ Order Confirmed';
    const userMsg = `Your order #${trackingNumber} has been confirmed.`;
    const userMetadata = {
      type: 'order_confirmed',
      orderId: populatedOrder._id.toString(),
      url: `/account/orders/${populatedOrder._id}`
    };

    // Save history & send FCM to User
    await saveWebNotification(populatedOrder.userId._id, userTitle, userMsg, 'order_confirmed', userMetadata);

    // 2. NOTIFY ADMINS (Telegram Group Alert)
    const alertLockKey = `alert_lock:order:${populatedOrder._id}`;
    const isAlreadyAlerted = await cacheService.get(alertLockKey);

    if (!isAlreadyAlerted) {
      await cacheService.set(alertLockKey, 'true', 60);
      await telegramService.sendInternalOrderAlert(adminPhone, populatedOrder);
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

    // Save history and send FCM to Admins
    await saveAdminWebNotification(adminTitle, adminMsg, 'new_order', adminMetadata);

    for (const admin of admins) {
      socketService.emitToAdmin('new_order_alert', { 
        orderId: populatedOrder._id, 
        orderNumber: trackingNumber,
        amount: populatedOrder.total,
        customer: populatedOrder.address.fullName 
      });
    }

    // 4. Trigger Custom Cake request alert if order contains custom cake
    const hasCustomCake = populatedOrder.items.some(item => item.isCustomCake);
    if (hasCustomCake) {
      await exports.notifyCustomCakeRequest(populatedOrder.address.fullName);
    }

    logger.info(`✅ All notifications sent for order ${trackingNumber}`);

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
    const { getFrontendUrl } = require('../utils/urlUtils');
    const trackingLink = `${getFrontendUrl()}/account/orders/${populatedOrder._id}`;
    const userPhone = populatedOrder.userId.phone || populatedOrder.address?.phone;
    
    // WEB UPDATE (SOCKET)
    socketService.emitToUser(populatedOrder.userId._id, 'status_changed', { orderId: populatedOrder._id, status });

    // WHATSAPP & EMAIL FOR SPECIFIC STATUSES
    if (status === 'out_for_delivery') {
      if (userPhone) {
        await whatsappService.sendOutForDelivery(userPhone, trackingNumber);
      }
      if (populatedOrder.userId.email) {
        emailService.sendDispatched(populatedOrder.userId.email, populatedOrder).catch(e => logger.error('Dispatch Email Failed:', e.message));
      }
      if (userPhone) {
        await telegramService.sendOutForDelivery(userPhone, trackingNumber, trackingLink, populatedOrder.userId._id);
      }
    } else if (status === 'delivered') {
      if (userPhone) {
        await whatsappService.sendDelivered(userPhone, trackingNumber);
      }
      logger.info(`Processing Delivered Email + Invoice for ${trackingNumber}`);
      const invoiceService = require('./invoiceService');
      await invoiceService.sendInvoiceAfterDelivery(populatedOrder._id, true);
      if (userPhone) {
        const { getFrontendUrl } = require('../utils/urlUtils');
        await telegramService.sendDelivered(userPhone, trackingNumber, `${getFrontendUrl()}/review`, populatedOrder.userId._id);
      }
    }

    // PUSH/DB NOTIFICATIONS FOR USER
    let title = '';
    let msg = '';
    let type = 'status_changed';

    switch (status) {
      case 'out_for_delivery':
        title = '🚚 Out For Delivery';
        msg = `Your order #${trackingNumber} is on the way.`;
        type = 'out_for_delivery';
        break;
      case 'delivered':
        title = '✅ Delivered';
        msg = `Your order #${trackingNumber} has been delivered.`;
        type = 'delivered';
        break;
      case 'cancelled':
        title = '❌ Order Cancelled';
        msg = `Your order #${trackingNumber} has been cancelled.`;
        type = 'order_cancelled';
        if (userPhone) {
          await whatsappService.sendWhatsApp(userPhone, `❌ Order Cancelled\n\nYour order #${trackingNumber} has been cancelled.`, 'user');
        }
        break;
      default:
        break;
    }

    if (title && msg) {
      const userMetadata = {
        type,
        orderId: populatedOrder._id.toString(),
        url: `/account/orders/${populatedOrder._id}`
      };
      await saveWebNotification(populatedOrder.userId._id, title, msg, type, userMetadata);
    }
  } catch (err) {
    logger.error('Status Notification Error (handleStatusChange):', err.message);
  }
};

exports.notifyOrderCancelled = async (order) => {
  try {
    const populatedOrder = await order.populate('userId');
    const trackingNumber = populatedOrder.orderNumber || populatedOrder._id.toString();
    const userPhone = populatedOrder.userId.phone || populatedOrder.address?.phone;

    // Send WhatsApp cancellation notification
    if (userPhone) {
      const message = `❌ *Order Cancelled*\n\n` +
        `🆔 Order: *${trackingNumber}*\n` +
        `Your order has been cancelled.\n\n` +
        `For any queries, please contact support.`;
      await whatsappService.sendWhatsApp(userPhone, message, 'user');
    }

    // 1. Notify User
    const userTitle = '❌ Order Cancelled';
    const userMsg = `Your order #${trackingNumber} has been cancelled.`;
    const userMetadata = {
      type: 'order_cancelled',
      orderId: populatedOrder._id.toString(),
      url: `/account/orders/${populatedOrder._id}`
    };

    await saveWebNotification(populatedOrder.userId._id, userTitle, userMsg, 'order_cancelled', userMetadata);

    // 2. Notify Admins
    const adminTitle = '❌ Order Cancelled';
    const adminMsg = `Order #${trackingNumber}\nCustomer: ${populatedOrder.address.fullName}`;
    const adminMetadata = {
      type: 'admin_order_cancelled',
      orderId: populatedOrder._id.toString(),
      url: '/admin/orders'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, 'admin_order_cancelled', adminMetadata);

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
        await whatsappService.sendPaymentFailure(
          populatedOrder.userId.phone, 
          populatedOrder.total, 
          populatedOrder.address.fullName
        );
      }

      const userTitle = 'Payment Failed 🔴';
      const userMsg = `Your payment of ₹${populatedOrder.total} for order #${trackingNumber} failed. Please retry.`;
      const userMetadata = {
        type: 'payment_failed',
        orderId: populatedOrder._id.toString(),
        url: `/account/orders/${populatedOrder._id}`
      };

      await saveWebNotification(populatedOrder.userId._id, userTitle, userMsg, 'payment_failed', userMetadata);
    }

    // 2. NOTIFY ADMINS
    await telegramService.sendAdminPaymentFailure(null, populatedOrder.address.fullName, populatedOrder.total);

    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      if (admin.email) {
        emailService.sendAdminPaymentFailed(admin.email, populatedOrder, reason)
          .catch(e => logger.error('Admin Payment Failed Email Error:', e.message));
      }
      if (admin.phone) {
        await whatsappService.sendAdminPaymentFailure(
          admin.phone, 
          populatedOrder.address.fullName, 
          populatedOrder.total
        );
      }
    }

    const adminTitle = '⚠️ Payment Failed';
    const adminMsg = `Order #${trackingNumber} payment failed.\nReason: ${reason || 'Unknown'}\nCustomer: ${populatedOrder.address.fullName}\nPhone: ${populatedOrder.userId?.phone || populatedOrder.address.phone}\nEmail: ${populatedOrder.userId?.email || 'N/A'}\nAmount: ₹${populatedOrder.total}`;
    const adminMetadata = {
      type: 'admin_payment_failed',
      orderId: populatedOrder._id.toString(),
      customerId: populatedOrder.userId?._id?.toString() || '',
      customerPhone: populatedOrder.userId?.phone || populatedOrder.address.phone,
      customerEmail: populatedOrder.userId?.email || '',
      reason: reason || 'Unknown',
      amount: String(populatedOrder.total),
      url: '/admin/orders'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, 'admin_payment_failed', adminMetadata);

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

    await saveAdminWebNotification(adminTitle, adminMsg, 'admin_payment_pending', adminMetadata);
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

    await saveAdminWebNotification(adminTitle, adminMsg, 'admin_refund_requested', adminMetadata);
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

    await saveAdminWebNotification(adminTitle, adminMsg, 'new_user_registration', adminMetadata);
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

    await saveAdminWebNotification(adminTitle, adminMsg, 'contact_form_submitted', adminMetadata);
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

    await saveAdminWebNotification(adminTitle, adminMsg, 'custom_cake_request', adminMetadata);
  } catch (err) {
    logger.error('Custom Cake Notification Error:', err.message);
  }
};

exports.notifyLowStockAlert = async (productName, quantity) => {
  try {
    const adminPhone = process.env.ADMIN_PHONE || '9363265477';
    await whatsappService.sendLowStockAlert(adminPhone, productName, quantity);
    
    const adminTitle = '📦 Low Stock Alert';
    const adminMsg = `${productName}\nRemaining: ${quantity}`;
    const adminMetadata = {
      type: 'low_stock_alert',
      url: '/admin/products'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, 'low_stock_alert', adminMetadata);
  } catch (err) {
    logger.error('Low Stock Notification Error:', err.message);
  }
};

exports.notifyOutOfStockAlert = async (productName) => {
  try {
    const adminPhone = process.env.ADMIN_PHONE || '9363265477';
    const message = `🚨 *OUT OF STOCK*\n\nProduct: ${productName}\nStatus: Completely out of stock!\n⚠️ Immediate restock required!`;
    await whatsappService.sendWhatsApp(adminPhone, message, 'admin');
    
    const adminTitle = '🚨 Product Out Of Stock';
    const adminMsg = `${productName}`;
    const adminMetadata = {
      type: 'out_of_stock_alert',
      url: '/admin/products'
    };

    await saveAdminWebNotification(adminTitle, adminMsg, 'out_of_stock_alert', adminMetadata);
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
    await saveBroadcastWebNotification(title, msg, 'new_product', metadata);

    // Check if product is not available
    if (product.stock === false) {
      await exports.notifyOutOfStockAlert(product.name);
    }
  } catch (err) {
    logger.error('New Product Notification Error:', err.message);
  }
};

exports.notifyBackInStock = async (product) => {
  try {
    const title = '🔥 Back In Stock';
    const msg = `${product.name} is available again.`;
    const metadata = {
      type: 'back_in_stock',
      productId: product._id.toString(),
      url: `/product/${product.slug || product._id}`
    };
    await saveBroadcastWebNotification(title, msg, 'back_in_stock', metadata);
  } catch (err) {
    logger.error('notifyBackInStock error:', err.message);
  }
};

exports.notifyOfferPrice = async (product) => {
  try {
    const title = '💰 Special Offer';
    const msg = `Special offer available on ${product.name}.`;
    const metadata = {
      type: 'new_offer',
      productId: product._id.toString(),
      url: `/product/${product.slug || product._id}`
    };
    await saveBroadcastWebNotification(title, msg, 'new_offer', metadata);
  } catch (err) {
    logger.error('notifyOfferPrice error:', err.message);
  }
};

exports.sendAdminBroadcast = async (title, message, metadata = {}) => {
  try {
    await saveBroadcastWebNotification(title, message, metadata.type || 'broadcast', metadata);
  } catch (err) {
    logger.error('sendAdminBroadcast error:', err.message);
  }
};

exports.notifyProductUpdated = async (product, previousData = {}) => {
  try {
    logger.info(`Product Update Check: ${product.name}`);
    
    // Broadcast via socket to all online users (always, for real-time UI)
    socketService.emitToAll('product_updated', {
      productId: product._id,
      name: product.name,
      message: `${product.name} details have been updated!`
    });

    // Determine what changed:
    const wasInStock = previousData.stock === true || previousData.stock === 'true';
    const isNowInStock = product.stock === true || product.stock === 'true';

    const isBackInStock = (!wasInStock || previousData.stock === false || previousData.stock === 'false') && isNowInStock;
    const isOutOfStock = wasInStock && !isNowInStock;
    const isNewOffer = product.offerPrice && product.offerPrice < product.price &&
                       (!previousData.offerPrice || previousData.offerPrice >= previousData.price);

    if (isBackInStock) {
      await exports.notifyBackInStock(product);
    } else if (isOutOfStock) {
      const title = '🚨 Out of Stock';
      const msg = `${product.name} is now temporarily out of stock.`;
      const metadata = {
        type: 'out_of_stock',
        productId: product._id.toString(),
        url: `/product/${product.slug || product._id}`
      };
      await saveBroadcastWebNotification(title, msg, 'out_of_stock', metadata);
    } else if (isNewOffer) {
      await exports.notifyOfferPrice(product);
    } else {
      // General update (broadcast to all users)
      const title = '🔄 Product Updated';
      const msg = `${product.name} has been updated with new details!`;
      const metadata = {
        type: 'product_updated',
        productId: product._id.toString(),
        url: `/product/${product.slug || product._id}`
      };
      await saveBroadcastWebNotification(title, msg, 'product_updated', metadata);
    }

    // Admin stock alerts (internal)
    if (product.stock === false) {
      await exports.notifyOutOfStockAlert(product.name);
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

    await saveBroadcastWebNotification(title, msg, 'new_offer', metadata);
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

    await saveBroadcastWebNotification(title, msg, 'coupon_added', metadata);
  } catch (err) {
    logger.error('Coupon Added Notification Error:', err.message);
  }
};

/* ==================================
   GENERIC ADMINISTRATIVE HELPERS
   ================================== */

exports.notifyAdminGeneric = async (title, body, payload = {}) => {
  try {
    await saveAdminWebNotification(title, body, payload.type || 'admin_generic', payload);
  } catch (err) {
    logger.error('Admin Generic Notification Error:', err.message);
  }
};

exports.notifyNewReview = async (review, user, product) => {
  try {
    const title = '⭐ New Review Submitted';
    const message = `Customer: ${user.name}\nPhone: ${user.phone || 'N/A'}\nEmail: ${user.email}\nProduct: ${product?.name || 'Product'}\nRating: ${review.rating} Stars\nComment: "${review.comment || 'No comment'}"`;
    const metadata = {
      type: 'new_review',
      reviewId: review._id.toString(),
      productId: review.productId.toString(),
      userId: user._id.toString(),
      url: '/admin/reviews'
    };
    await saveAdminWebNotification(title, message, 'new_review', metadata);
  } catch (err) {
    logger.error('New Review Notification Error:', err.message);
  }
};

exports.notifyAdminError = async (title, errorMessage, payload = {}) => {
  try {
    const finalPayload = { ...payload, type: 'system_error' };
    await saveAdminWebNotification(`⚠️ System Error: ${title}`, errorMessage, 'system_error', finalPayload);
  } catch (err) {
    logger.error('Admin Error Notification Failed:', err.message);
  }
};
