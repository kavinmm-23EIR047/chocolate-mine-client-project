'use strict';

const axios = require('axios');
const { formatPhone } = require('../utils/phoneUtil');
const logger = require('../utils/logger');

// =============================================================================
// AiSensy v2 Campaign API Configuration
// =============================================================================

/**
 * Sends a WhatsApp message using the official AiSensy Campaign API.
 * Requires a pre-approved template with placeholder {{1}}.
 * The message content is passed as the first template parameter.
 *
 * @param {string} to - Recipient phone number (any format, will be normalized)
 * @param {string} message - Text message to fill into the template's {{1}} variable
 * @param {string} role - 'user', 'staff', 'admin' (for logging and as userName fallback)
 * @returns {Promise<void>}
 */
const sendWhatsApp = async (to, message, role = 'unknown') => {
  const provider = process.env.NOTIFICATION_PROVIDER || 'aisensy';

  // Fallback to legacy providers (Whapi / CallMeBot) if configured
  if (provider !== 'aisensy') {
    return sendWhatsAppLegacy(to, message, role);
  }

  // --- Validate environment variables ---
  const apiKey = process.env.AISENSY_API_KEY;
  const campaignName = process.env.AISENSY_CAMPAIGN_NAME;
  if (!apiKey || !campaignName) {
    logger.warn(`WhatsApp [${role}] skipped: AiSensy API key or campaign name missing`);
    return;
  }

  // --- Normalize phone number (must include country code and '+' prefix) ---
  let formattedPhone = formatPhone(to);
  if (!formattedPhone) {
    logger.warn(`WhatsApp [${role}] skipped: invalid phone number (${to})`);
    return;
  }
  // Ensure the number starts with '+'
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+${formattedPhone}`;
  }

  const apiUrl = process.env.AISENSY_API_URL || 'https://backend.aisensy.com/campaign/t1/api/v2';

  // --- Correct payload as per AiSensy v2 Campaign API documentation ---
  const payload = {
    apiKey: apiKey,                     // Required – must be in body, not headers
    campaignName: campaignName,         // Required – your approved template name
    destination: formattedPhone,        // Required – with country code and '+'
    userName: role,                     // Recommended – used for analytics (customer name could be added later)
    templateParams: [message]         // Required – fills {{1}} in your WhatsApp template
  };

  try {
    await axios.post(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    logger.info(`WhatsApp [${role}] (AiSensy v2) SENT to ${formattedPhone}`);
  } catch (err) {
    const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    logger.error(`WhatsApp [${role}] FAILED: ${errMsg}`);
    // Silently fail – never break the main order flow
  }
};

// =============================================================================
// Legacy WhatsApp Sender (Whapi / CallMeBot) – kept as optional fallback
// =============================================================================
const sendWhatsAppLegacy = async (to, message, role) => {
  const mode = process.env.NOTIFICATION_MODE || 'whapi';
  let formattedPhone = formatPhone(to);
  if (formattedPhone) formattedPhone = formattedPhone.replace('+', '');
  if (!formattedPhone) return;

  try {
    if (mode === 'callmebot') {
      const apikey = process.env.CALLMEBOT_APIKEY;
      if (!apikey) return;
      const url = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodeURIComponent(message)}&apikey=${apikey}`;
      await axios.get(url);
      logger.info(`WhatsApp [${role}] (CallMeBot) SENT`);
    } else {
      // Whapi.Cloud
      const whapiUrl = `${process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud'}/messages/text`;
      const authHeader = { Authorization: `Bearer ${process.env.WHAPI_TOKEN}`, 'Content-Type': 'application/json' };
      await axios.post(whapiUrl, { to: formattedPhone, body: message }, { headers: authHeader });
      logger.info(`WhatsApp [${role}] (Whapi) SENT`);
    }
  } catch (err) {
    const errMsg = err.response?.data?.error || err.message;
    logger.error(`Legacy WhatsApp [${role}] FAILED: ${errMsg}`);
  }
};

// =============================================================================
// USER Notifications (unchanged – they only call sendWhatsApp)
// =============================================================================

const sendOrderPlaced = (phone, orderNumber) => {
  return sendWhatsApp(phone, `Your order ${orderNumber} has been placed.`, 'user');
};

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
    `📅 *Delivery Date:* ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}\n` +
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
// STAFF Notifications (unchanged)
// =============================================================================

const sendKitchenAlert = (staffPhone, orderNumber) => {
  return sendWhatsApp(staffPhone, `🍴 New kitchen order received: ${orderNumber}. Please begin preparation.`, 'staff');
};

const sendUrgentSlotAlert = (staffPhone, orderNumber, slot) => {
  return sendWhatsApp(staffPhone, `⚡ URGENT: Order ${orderNumber} for slot "${slot}" requires immediate attention!`, 'staff');
};

// =============================================================================
// ADMIN Notifications (unchanged)
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

const sendPaymentFailed = sendAdminPaymentFailure;

const sendLowStockAlert = (adminPhone, productName, stock) => {
  return sendWhatsApp(adminPhone, `⚠️ LOW STOCK: ${productName} is down to ${stock} units. Restock soon.`, 'admin');
};

// =============================================================================
// Exports (unchanged)
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
  sendPaymentFailed,
  sendLowStockAlert
};