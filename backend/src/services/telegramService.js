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
 */
const sendInternalOrderAlert = (phone, order) => {
  // If only one argument is passed, it might be the order
  const orderObj = (typeof phone === 'object') ? phone : order;
  
  const itemsList = orderObj.items.map(item => `${item.name} (x${item.qty})`).join(', ');
  const address = `${orderObj.address.fullName}, ${orderObj.address.houseNo}, ${orderObj.address.street}, ${orderObj.address.city} - ${orderObj.address.pincode}`;
  
  const message = `🍫 *New Order Received*\n\n` +
    `🆔 *Order ID:* ${orderObj.orderNumber}\n` +
    `👤 *Customer Name:* ${orderObj.address.fullName}\n` +
    `📞 *Customer Phone:* ${orderObj.address.phone}\n` +
    `📍 *Full Address:* ${address}\n` +
    `🍰 *Ordered Items:* ${itemsList}\n` +
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
