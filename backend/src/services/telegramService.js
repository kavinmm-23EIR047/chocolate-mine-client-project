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
// Helper: Resolve dynamic display flavor for order items
const getDisplayFlavor = (item) => {
  if (!item) return 'Standard';
  if (item.isCustomCake) return item.selectedFlavor || 'Custom';
  const flavor = item.selectedFlavor;
  if (!flavor || flavor.toLowerCase() === 'standard') {
    const cat = Array.isArray(item.category) ? item.category.join(' ').toLowerCase() : String(item.category || '').toLowerCase();
    const name = String(item.name || '').toLowerCase();
    if (cat.includes('chocolate') || name.includes('chocolate') || name.includes('forest') || name.includes('fudge') || name.includes('truffle') || name.includes('oreo') || name.includes('caramel')) return 'Chocolate';
    if (cat.includes('vanilla') || name.includes('vanilla') || name.includes('pineapple') || name.includes('butterscotch') || name.includes('strawberry') || name.includes('blueberry') || name.includes('biscoff') || name.includes('jamun') || name.includes('gulkand') || name.includes('rasmalai') || name.includes('honey') || name.includes('almond') || name.includes('lychee') || name.includes('rose')) return 'Vanilla';
    if (cat.includes('red-velvet') || cat.includes('red velvet') || name.includes('red-velvet') || name.includes('red velvet')) return 'Red Velvet';
    if (cat.includes('bento') || name.includes('bento')) return 'Bento';
    return 'Standard';
  }
  return flavor;
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
  const finalUnitPrice = Number(item.finalPrice ?? item.price ?? 0);
  const origPrice = Number(item.price || 0);
  let priceDetails = ``;
  if (origPrice > finalUnitPrice) {
    priceDetails = ` (Orig: ₹${origPrice}, Offer: ₹${finalUnitPrice})`;
  } else {
    priceDetails = ` (₹${finalUnitPrice})`;
  }

  let addonStr = '';
  if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
    const addonList = item.addons.map(a => `${a.name} (x${a.qty || 1}) - ₹${a.price * (a.qty || 1)}`).join(', ');
    addonStr = `\n   └ Addons: ${addonList}`;
  }

  if (item.isCustomCake && item.customDetails) {
    const cd = item.customDetails;
    let details = `🎨 *${item.name}* (x${item.qty})${priceDetails}\n`;
    if (cd.designTheme) details += `   Theme: ${cd.designTheme}\n`;
    if (cd.flavour) details += `   Flavor: ${cd.flavour}\n`;
    if (cd.weight) details += `   Weight: ${cd.weight}\n`;
    if (cd.messageOnCake) {
      let cleanedMsg = cd.messageOnCake.trim();
      if (cleanedMsg !== 'Name: , Age: , Message: None' && cleanedMsg !== 'Name: , Age: , Message:') {
        const match = cleanedMsg.match(/Message:\s*(.*)$/i);
        if (match && match[1]) {
          cleanedMsg = match[1].trim();
        }
        if (cleanedMsg && cleanedMsg !== 'None') details += `   🎂 Message: ${cleanedMsg}\n`;
      }
    }
    if (addonStr) details += `   ${addonStr.trim()}\n`;
    return details.trim();
  }
  
  // Normal product
  let details = `🍰 *${item.name}* (x${item.qty})${priceDetails}`;
  const resolvedFlavor = getDisplayFlavor(item);
  const showFlavor = item.selectedFlavor || resolvedFlavor !== 'Standard';
  const showWeight = item.selectedWeight;
  if (showFlavor || showWeight || addonStr) {
    details += `\n`;
    if (showFlavor) details += `   Flavor: ${resolvedFlavor}\n`;
    if (showWeight) details += `   Weight: ${showWeight}\n`;
    if (addonStr) details += `   ${addonStr.trim()}\n`;
  }
  return details.trim();
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
const formatIST = (dateVal) => {
  const d = dateVal ? new Date(dateVal) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  return validDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

const sendInternalOrderAlert = (phone, order) => {
  // If only one argument is passed, it might be the order
  const orderObj = (typeof phone === 'object') ? phone : order;
  
  // Build detailed items list with custom cake support
  const itemsList = orderObj.items.map(item => formatOrderItem(item)).join('\n');
  
  const addrParts = [];
  if (orderObj.address.fullName) addrParts.push(orderObj.address.fullName);
  if (orderObj.address.houseNo) addrParts.push(orderObj.address.houseNo);
  if (orderObj.address.street) addrParts.push(orderObj.address.street);
  if (orderObj.address.landmark) addrParts.push(`Landmark: ${orderObj.address.landmark}`);
  if (orderObj.address.city) addrParts.push(orderObj.address.city);
  if (orderObj.address.pincode) addrParts.push(orderObj.address.pincode);
  const address = addrParts.join(', ');

  let mapsUrlMsg = '';
  if (orderObj.address.lat && orderObj.address.lng) {
    mapsUrlMsg = `\n🗺️ *Directions:* https://www.google.com/maps/search/?api=1&query=${orderObj.address.lat},${orderObj.address.lng}`;
  }

  const orderedTimeString = formatIST(orderObj.createdAt || orderObj.updatedAt);
  const deliveryDateString = orderObj.deliveryDate ? new Date(orderObj.deliveryDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A';
  
  const message = `🍫 *New Order Received*\n\n` +
    `🆔 *Order ID:* ${orderObj.orderNumber}\n` +
    `👤 *Customer Name:* ${orderObj.address.fullName}\n` +
    `📞 *Customer Phone:* ${orderObj.address.phone}\n` +
    `📍 *Full Address:* ${address}\n\n` +
    `🍰 *Ordered Items:*\n${itemsList}\n\n` +
    `💰 *Pricing Breakdown:*\n` +
    `   Subtotal: ₹${orderObj.subtotal}\n` +
    (orderObj.discount > 0 ? `   Discount: -₹${orderObj.discount}\n` : '') +
    `   Delivery Charge: ₹${orderObj.deliveryCharge}\n` +
    `   Convenience Fee (2.5%): ₹${orderObj.convenienceFee}\n` +
    `   GST (18%): Inclusive\n` +
    `   *Grand Total:* ₹${orderObj.total}\n\n` +
    `📅 *Delivery Date:* ${deliveryDateString}\n` +
    `⏰ *Delivery Slot:* ${orderObj.deliverySlot || 'N/A'}\n` +
    `📅 *Ordered Time:* ${orderedTimeString} (IST)` +
    mapsUrlMsg + `\n\n` +
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