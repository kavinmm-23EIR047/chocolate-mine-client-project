'use strict';

const axios = require('axios');
const { formatPhone } = require('../utils/phoneUtil');
const logger = require('../utils/logger');

// Build URL dynamically so it correctly reads .env after startup
const getWhapiApiUrl = () => `${process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud'}/messages/text`;
const getAuthHeader = () => ({ 
  Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
  'Content-Type': 'application/json'
});

/**
 * Core reusable WhatsApp sender.
 * Supports Whapi.Cloud or CallMeBot.
 * Fails silently — never breaks the API response.
 */
const sendWhatsApp = async (to, message, role = 'unknown') => {
  const mode = process.env.NOTIFICATION_MODE || 'whapi';

  // Let's enable user messages as per new requirement
  // if (role === 'user') {
  //   return;
  // }

  try {
    // Existing WhatsApp logic (Whapi / CallMeBot)
    let formattedPhone = formatPhone(to);
    if (formattedPhone) {
      formattedPhone = formattedPhone.replace('+', '');
    }

    if (!formattedPhone) {
      logger.warn(`WhatsApp skipped [${role}]: phone missing`);
      return;
    }

    if (mode === 'callmebot') {
      const apikey = process.env.CALLMEBOT_APIKEY;
      if (!apikey) return logger.warn('CallMeBot skipped: APIKEY missing');
      
      const url = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodeURIComponent(message)}&apikey=${apikey}`;
      await axios.get(url);
      logger.info(`WhatsApp [${role}] (CallMeBot) SENT`);
    } else {
      // Whapi.Cloud Integration
      if (!process.env.WHAPI_TOKEN) return logger.warn('Whapi skipped: TOKEN missing');

      await axios.post(
        getWhapiApiUrl(),
        { to: formattedPhone, body: message },
        { headers: getAuthHeader() }
      );
      logger.info(`WhatsApp [${role}] (Whapi) SENT`);
    }
  } catch (err) {
    const errMsg = err.response?.data?.error || err.message;
    logger.error(`Notification [${role}] FAILED: ${errMsg}`);
  }
};




// =============================================================================
// USER Notifications
// =============================================================================

/**
 * User order placed (Skipped per business strategy)
 */
const sendOrderPlaced = (phone, orderNumber) => {
  return sendWhatsApp(phone, `Your order ${orderNumber} has been placed.`, 'user');
};

/**
 * Rich Order alert for internal staff/admin (CallMeBot format)
 */
const sendInternalOrderAlert = (to, order) => {
  const itemsList = order.items.map(item => `${item.name} (x${item.qty})`).join(', ');
  const address = `${order.address.fullName}, ${order.address.houseNo}, ${order.address.street}, ${order.address.city} - ${order.address.pincode}`;
  
  const emoji = '🔔';
  const footer = 'Check dashboard for more details.';

  const message = `${emoji} *New Order Received*\n\n` +
    `🆔 *Order ID:* ${order.orderNumber}\n` +
    `👤 *Customer Name:* ${order.address.fullName}\n` +
    `📞 *Customer Phone:* ${order.address.phone}\n` +
    `📍 *Full Address:* ${address}\n` +
    `🍰 *Ordered Items:* ${itemsList}\n` +
    `💰 *Total Amount:* ₹${order.total}\n` +
    `⏰ *Delivery Slot:* ${order.deliverySlot || 'N/A'}\n` +
    `📅 *Ordered Time:* ${new Date(order.createdAt).toLocaleString()}\n\n` +
    footer;

  return sendWhatsApp(to, message, 'admin');
};




const sendPreparing = (phone, orderNumber) => {
  return sendWhatsApp(phone, `Your order ${orderNumber} is being prepared in our kitchen. 🍰`, 'user');
};

const sendPacked = (phone, orderNumber) => {
  return sendWhatsApp(phone, `Your order ${orderNumber} has been packed and is ready for dispatch. 📦`, 'user');
};

const sendOutForDelivery = (phone, orderNumber) => {
  return sendWhatsApp(phone, `Your order ${orderNumber} is out for delivery! Our delivery partner is on the way. 🚚`, 'user');
};

const sendDelivered = (phone, orderNumber) => {
  return sendWhatsApp(phone, `Your order ${orderNumber} has been delivered. Thank you for choosing The Chocolate Mine! 🎉`, 'user');
};

const sendInvoiceReady = (phone, orderNumber) => {
  return sendWhatsApp(phone, `Your invoice for order ${orderNumber} has been sent to your registered email address. 📧`, 'user');
};

const sendPaymentFailure = (phone, amount, customerName) => {
  return sendWhatsApp(
    phone,
    `Hi ${customerName || 'Customer'}, your payment of ₹${amount} could not be processed. Please retry or contact support.`,
    'user'
  );
};

// =============================================================================
// STAFF Notifications
// =============================================================================

const sendKitchenAlert = (staffPhone, orderNumber) => {
  return sendWhatsApp(staffPhone, `🍴 New kitchen order received: ${orderNumber}. Please begin preparation.`, 'staff');
};

const sendUrgentSlotAlert = (staffPhone, orderNumber, slot) => {
  return sendWhatsApp(staffPhone, `⚡ URGENT: Order ${orderNumber} for slot "${slot}" requires immediate attention!`, 'staff');
};

// =============================================================================
// ADMIN Notifications
// =============================================================================

const sendAdminNewOrder = (adminPhone, orderNumber, total) => {
  return sendWhatsApp(adminPhone, `📥 New order ${orderNumber} received. Total: ₹${total}`, 'admin');
};

const sendHighValueAlert = (adminPhone, orderNumber, total) => {
  return sendWhatsApp(adminPhone, `⚠️ HIGH VALUE ORDER: ${orderNumber} worth ₹${total}. Check dashboard immediately.`, 'admin');
};

const sendAdminPaymentFailure = (adminPhone, customerName, amount) => {
  return sendWhatsApp(adminPhone, `🔴 Payment FAILED: ₹${amount} from customer "${customerName}". Review in dashboard.`, 'admin');
};

// Alias for backward compatibility
const sendPaymentFailed = sendAdminPaymentFailure;


// =============================================================================
// Exports
// =============================================================================

module.exports = {
  sendWhatsApp,

  // User
  sendOrderPlaced,
  sendPreparing,
  sendPacked,
  sendOutForDelivery,
  sendDelivered,
  sendInvoiceReady,
  sendPaymentFailure,

  // Staff / Kitchen
  sendInternalOrderAlert,
  sendKitchenAlert,
  sendUrgentSlotAlert,

  // Admin
  sendAdminNewOrder,
  sendHighValueAlert,
  sendAdminPaymentFailure,
  sendPaymentFailed: sendAdminPaymentFailure,
  sendLowStockAlert: (adminPhone, productName, stock) => {
    return sendWhatsApp(adminPhone, `⚠️ LOW STOCK: ${productName} is down to ${stock} units. Restock soon.`, 'admin');
  }
};

