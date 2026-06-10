'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Core Telegram sender using Bot API.
 * Fails silently — never breaks the main execution flow.
 * @param {string} message - Plain text or Markdown message
 */
const sendTelegram = async (message) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    logger.warn('Telegram skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in .env');
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });
    logger.info('Telegram Alert SENT');
  } catch (err) {
    const errMsg = err.response?.data?.description || err.message;
    logger.error(`Telegram FAILED: ${errMsg}`);
  }
};

// =============================================================================
// Helper: Format a single order item with custom cake details
// =============================================================================

/**
 * Formats an order item for Telegram display.
 * For custom cakes, shows theme, flavour, weight, and personalized message.
 * 
 * @param {Object} item - Order item from database
 * @returns {string} Formatted item string (multi-line if custom cake)
 */
const formatOrderItem = (item) => {
  if (item.isCustomCake && item.customDetails) {
    const cd = item.customDetails;
    let details = `🎨 *${item.name}* (x${item.qty})\n`;
    if (cd.designTheme) details += `   Theme: ${cd.designTheme}\n`;
    if (cd.flavour) details += `   Flavor: ${cd.flavour}\n`;
    if (cd.weight) details += `   Weight: ${cd.weight}\n`;
    if (cd.messageOnCake) {
      // Clean up the message: remove default "Name: , Age: , Message: None"
      let cleanedMsg = cd.messageOnCake.trim();
      if (cleanedMsg !== 'Name: , Age: , Message: None' && cleanedMsg !== 'Name: , Age: , Message:') {
        // Extract only the message part after "Message: "
        const match = cleanedMsg.match(/Message:\s*(.*)$/i);
        if (match && match[1]) {
          cleanedMsg = match[1].trim();
        }
        if (cleanedMsg && cleanedMsg !== 'None') details += `   🎂 Message: ${cleanedMsg}\n`;
      }
    }
    return details.trim();
  }
  // Normal product
  return `🍰 ${item.name} (x${item.qty})`;
};

// =============================================================================
// USER Notifications (SKIPPED for Telegram - keeps logic silent)
// =============================================================================

const sendOrderPlaced = () => {};
const sendPreparing = () => {};
const sendPacked = () => {};
const sendOutForDelivery = () => {};
const sendDelivered = () => {};
const sendInvoiceReady = () => {};
const sendPaymentFailure = () => {};
const sendMediaWhatsApp = () => {};

// =============================================================================
// INTERNAL ALERTS (Admin + Staff Group)
// All functions accept a phone number for backward compatibility but ignore it.
// =============================================================================

/**
 * Rich Order alert for internal staff/admin group
 * Now includes custom cake details inline with items.
 */
const sendInternalOrderAlert = (phone, order) => {
  // If only one argument is passed, it might be the order
  const orderObj = (typeof phone === 'object') ? phone : order;
  
  // Build detailed items list with custom cake support
  const itemsList = orderObj.items.map(item => formatOrderItem(item)).join('\n');
  const address = `${orderObj.address.fullName}, ${orderObj.address.houseNo}, ${orderObj.address.street}, ${orderObj.address.city} - ${orderObj.address.pincode}`;
  
  const message = `🍫 *New Order Received*\n\n` +
    `🆔 *Order ID:* ${orderObj.orderNumber}\n` +
    `👤 *Customer Name:* ${orderObj.address.fullName}\n` +
    `📞 *Customer Phone:* ${orderObj.address.phone}\n` +
    `📍 *Full Address:* ${address}\n` +
    `🍰 *Ordered Items:*\n${itemsList}\n` +
    `💰 *Total Amount:* ₹${orderObj.total}\n` +
    `📅 *Delivery Date:* ${orderObj.deliveryDate ? new Date(orderObj.deliveryDate).toLocaleDateString() : 'N/A'}\n` +
    `⏰ *Delivery Slot:* ${orderObj.deliverySlot || 'N/A'}\n` +
    `📅 *Ordered Time:* ${new Date(orderObj.createdAt).toLocaleString()}\n\n` +
    `Please check admin dashboard now.`;

  return sendTelegram(message);
};

const sendKitchenAlert = (phone, orderNumber) => {
  return sendTelegram(`🍴 *New Kitchen Order:* ${orderNumber}\nPlease check dashboard to accept.`);
};

const sendUrgentSlotAlert = (phone, orderNumber, slot) => {
  return sendTelegram(`⚡ *URGENT SAME SLOT ORDER*\nOrder: ${orderNumber}\nSlot: ${slot}\nImmediate attention required!`);
};

const sendAdminNewOrder = (phone, orderNumber, total) => {
  return sendTelegram(`📥 *New Order:* ${orderNumber}\nTotal: ₹${total}`);
};

const sendHighValueAlert = (phone, orderNumber, total) => {
  return sendTelegram(`⚠️ *HIGH VALUE ALERT*\nOrder: ${orderNumber}\nAmount: ₹${total}`);
};

const sendAdminPaymentFailure = (phone, customerName, amount) => {
  return sendTelegram(`🔴 *Payment FAILED*\nAmount: ₹${amount}\nCustomer: ${customerName}\nReview in dashboard.`);
};

const sendLowStockAlert = (phone, productName, stock) => {
  return sendTelegram(`⚠️ *LOW STOCK ALERT*\nProduct: ${productName}\nRemaining: ${stock} units\nRestock immediately.`);
};

const sendServerErrorAlert = (errorMsg) => {
  return sendTelegram(`🔥 *SERVER ERROR*\nMsg: ${errorMsg}`);
};

const sendStaffAlert = (message) => {
  return sendTelegram(`👨‍🍳 *Staff Alert:* ${message}`);
};

// For backward compatibility, also export the old name
const sendInternalOrderAlertWithCustomDetails = sendInternalOrderAlert;

module.exports = {
  sendTelegram,
  sendInternalOrderAlert,
  sendOrderPlaced,
  sendPreparing,
  sendPacked,
  sendOutForDelivery,
  sendDelivered,
  sendInvoiceReady,
  sendPaymentFailure,
  sendMediaWhatsApp,
  sendKitchenAlert,
  sendUrgentSlotAlert,
  sendAdminNewOrder,
  sendHighValueAlert,
  sendAdminPaymentFailure,
  sendPaymentFailed: sendAdminPaymentFailure,
  sendLowStockAlert,
  sendServerErrorAlert,
  sendStaffAlert
};