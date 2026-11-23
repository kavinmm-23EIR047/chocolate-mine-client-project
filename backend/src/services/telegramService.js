'use strict';

const axios = require('axios');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const Product = require('../models/Product');
const { resolveProductWeight } = require('../utils/productUtils');

/**
 * Escapes characters that have special meaning in Telegram HTML mode.
 * @param {string|number} str
 * @returns {string}
 */
const escapeHtml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Core Telegram sender using Bot API.
 * Uses HTML parse mode with automatic plain-text retry fallback so alerts never fail silently.
 * @param {string} message - HTML or plain text message
 * @param {Object} [options]
 */
const sendTelegram = async (message, options = {}) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    logger.warn('Telegram skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in .env');
    return;
  }

  const parseMode = options.parse_mode !== undefined ? options.parse_mode : 'HTML';

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      ...(parseMode ? { parse_mode: parseMode } : {})
    });
    logger.info('Telegram Alert SENT');
  } catch (err) {
    const errMsg = err.response?.data?.description || err.message;
    logger.error(`Telegram FAILED (${parseMode}): ${errMsg}`);

    // Automatic Fallback: If Telegram rejects due to entity parsing issues (e.g. unclosed tag or special chars),
    // immediately retry sending as plain text so the admin always receives the order alert!
    if (errMsg.includes("can't parse entities") || errMsg.includes('entity')) {
      try {
        logger.warn('Retrying Telegram message as plain-text fallback...');
        const plainText = String(message)
          .replace(/<[^>]*>/g, '') // strip HTML tags
          .replace(/[*_`\[\]()]/g, ''); // strip markdown chars if any

        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
          chat_id: chatId,
          text: plainText
        });
        logger.info('✅ Telegram Alert SENT via plain-text fallback');
        return;
      } catch (fallbackErr) {
        const fallbackMsg = fallbackErr.response?.data?.description || fallbackErr.message;
        logger.error(`Telegram fallback FAILED: ${fallbackMsg}`);
        throw fallbackErr;
      }
    }
    throw err;
  }
};

// =============================================================================
// Helper: Resolve dynamic display flavor for order items
// =============================================================================
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
 * Formats an order item for Telegram display using HTML tags.
 * For custom cakes, shows theme, flavour, weight, and personalized message.
 * 
 * @param {Object} item - Order item from database
 * @param {Object} [product] - Populated product doc
 * @returns {string} Formatted item string (multi-line if custom cake)
 */
const formatOrderItem = (item, product = null) => {
  const finalUnitPrice = Number(item.finalPrice ?? item.price ?? 0);
  const origPrice = Number(item.price || 0);
  let priceDetails = '';
  if (origPrice > finalUnitPrice) {
    priceDetails = ` (Orig: ₹${origPrice}, Offer: ₹${finalUnitPrice})`;
  } else {
    priceDetails = ` (₹${finalUnitPrice})`;
  }

  let addonStr = '';
  if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
    const addonList = item.addons
      .map(a => `${escapeHtml(a.name)} (x${a.qty || 1}) - ₹${a.price * (a.qty || 1)}`)
      .join(', ');
    addonStr = `\n   └ Addons: ${addonList}`;
  }

  if (item.isCustomCake && item.customDetails) {
    const cd = item.customDetails;
    let details = `🎨 <b>${escapeHtml(item.name)}</b> (x${item.qty})${priceDetails}\n`;
    if (cd.designTheme) details += `   Theme: ${escapeHtml(cd.designTheme)}\n`;
    if (cd.flavour) details += `   Flavor: ${escapeHtml(cd.flavour)}\n`;
    if (cd.weight) details += `   Weight: ${escapeHtml(cd.weight)}\n`;
    if (cd.messageOnCake) {
      let cleanedMsg = cd.messageOnCake.trim();
      if (cleanedMsg !== 'Name: , Age: , Message: None' && cleanedMsg !== 'Name: , Age: , Message:') {
        const match = cleanedMsg.match(/Message:\s*(.*)$/i);
        if (match && match[1]) {
          cleanedMsg = match[1].trim();
        }
        if (cleanedMsg && cleanedMsg !== 'None') {
          details += `   🎂 Message: ${escapeHtml(cleanedMsg)}\n`;
        }
      }
    }
    if (addonStr) details += `   ${addonStr.trim()}\n`;
    return details.trim();
  }
  
  // Normal product
  let details = `🍰 <b>${escapeHtml(item.name)}</b> (x${item.qty})${priceDetails}`;
  const resolvedFlavor = getDisplayFlavor(item);
  const showFlavor = item.selectedFlavor || resolvedFlavor !== 'Standard';

  // Resolve weight accurately using product rules or smart heuristics
  let showWeight = null;
  if (product) {
    showWeight = resolveProductWeight(product, item.selectedWeight, item.finalPrice ?? item.price);
  }
  if (!showWeight) {
    const cat = Array.isArray(item.category) ? item.category.join(' ').toLowerCase() : String(item.category || '').toLowerCase();
    const name = String(item.name || '').toLowerCase();
    if (cat.includes('mini') || name.includes('mini')) {
      showWeight = '130g';
    } else if (cat.includes('bento') || name.includes('bento')) {
      showWeight = (item.selectedWeight && item.selectedWeight !== '500g') ? item.selectedWeight : '250g';
    } else {
      showWeight = item.selectedWeight;
    }
  }

  const msgOnCake = (item.cakeMessage || item.messageOnCake || '').trim();
  if (showFlavor || showWeight || msgOnCake || addonStr) {
    details += `\n`;
    if (showFlavor) details += `   Flavor: ${escapeHtml(resolvedFlavor)}\n`;
    if (showWeight) details += `   Weight: ${escapeHtml(showWeight)}\n`;
    if (msgOnCake) details += `   🎂 Message: "${escapeHtml(msgOnCake)}"\n`;
    if (addonStr) details += `   ${addonStr.trim()}\n`;
  }
  return details.trim();
};

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
 * Includes custom cake details inline with items.
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

const sendInternalOrderAlert = async (phone, order) => {
  // If only one argument is passed, it might be the order
  const orderObj = (typeof phone === 'object') ? phone : order;
  if (!orderObj || !Array.isArray(orderObj.items)) return;

  // Batch query products for accurate item details and weights
  const productIds = orderObj.items
    .map(i => i.productId?._id || i.productId)
    .filter(id => id && String(id).match(/^[0-9a-fA-F]{24}$/));

  const productMap = {};
  if (productIds.length > 0) {
    try {
      const prods = await Product.find({ _id: { $in: productIds } }).lean();
      prods.forEach(p => { productMap[p._id.toString()] = p; });
    } catch (err) {
      logger.warn(`Could not load products for Telegram alert: ${err.message}`);
    }
  }

  // Build detailed items list with custom cake support
  const itemsList = orderObj.items.map(item => {
    const pId = (item.productId?._id || item.productId)?.toString();
    const prod = productMap[pId] || (item.productId && typeof item.productId === 'object' && item.productId.name ? item.productId : null);
    return formatOrderItem(item, prod);
  }).join('\n');
  
  const addr = orderObj.address || {};
  const addrParts = [];
  if (addr.fullName) addrParts.push(escapeHtml(addr.fullName));
  if (addr.houseNo) addrParts.push(escapeHtml(addr.houseNo));
  if (addr.street) addrParts.push(escapeHtml(addr.street));
  if (addr.landmark) addrParts.push(`Landmark: ${escapeHtml(addr.landmark)}`);
  if (addr.city) addrParts.push(escapeHtml(addr.city));
  if (addr.pincode) addrParts.push(escapeHtml(addr.pincode));
  const address = addrParts.join(', ');

  let mapsUrlMsg = '';
  if (addr.lat && addr.lng) {
    mapsUrlMsg = `\n🗺️ <b>Directions:</b> <a href="https://www.google.com/maps/search/?api=1&query=${addr.lat},${addr.lng}">Open in Google Maps</a>`;
  }

  const orderedTimeString = formatIST(orderObj.createdAt || orderObj.updatedAt);
  const deliveryDateString = orderObj.deliveryDate ? new Date(orderObj.deliveryDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A';
  
  const message = `🍫 <b>New Order Received</b>\n\n` +
    `🆔 <b>Order ID:</b> ${escapeHtml(orderObj.orderNumber)}\n` +
    `👤 <b>Customer Name:</b> ${escapeHtml(addr.fullName || 'N/A')}\n` +
    `📞 <b>Customer Phone:</b> ${escapeHtml(addr.phone || 'N/A')}\n` +
    `📍 <b>Full Address:</b> ${address}\n\n` +
    `🍰 <b>Ordered Items:</b>\n${itemsList}\n\n` +
    `💰 <b>Pricing Breakdown:</b>\n` +
    `   Subtotal: ₹${orderObj.subtotal}\n` +
    (orderObj.discount > 0 ? `   Discount: -₹${orderObj.discount}\n` : '') +
    `   Delivery Charge: ₹${orderObj.deliveryCharge}\n` +
    `   Convenience Fee (2.5%): ₹${orderObj.convenienceFee}\n` +
    `   GST (5%): Included in product price\n` +
    `   <b>Grand Total:</b> ₹${orderObj.total}\n\n` +
    `📅 <b>Delivery Date:</b> ${deliveryDateString}\n` +
    `⏰ <b>Delivery Slot:</b> ${escapeHtml(orderObj.deliverySlot || 'N/A')}\n` +
    `📅 <b>Ordered Time:</b> ${orderedTimeString} (IST)` +
    mapsUrlMsg + `\n\n` +
    `Please check admin dashboard now.`;

  return sendTelegram(message, { parse_mode: 'HTML' });
};

const sendKitchenAlert = (phone, orderNumber) => {
  return sendTelegram(`🍴 <b>New Kitchen Order:</b> ${escapeHtml(orderNumber)}\nPlease check dashboard to accept.`);
};

const sendUrgentSlotAlert = (phone, orderNumber, slot) => {
  return sendTelegram(`⚡ <b>URGENT SAME SLOT ORDER</b>\nOrder: ${escapeHtml(orderNumber)}\nSlot: ${escapeHtml(slot)}\nImmediate attention required!`);
};

const sendAdminNewOrder = (phone, orderNumber, total) => {
  return sendTelegram(`📥 <b>New Order:</b> ${escapeHtml(orderNumber)}\nTotal: ₹${total}`);
};

const sendHighValueAlert = (phone, orderNumber, total) => {
  return sendTelegram(`⚠️ <b>HIGH VALUE ALERT</b>\nOrder: ${escapeHtml(orderNumber)}\nAmount: ₹${total}`);
};

const sendAdminPaymentFailure = (phone, customerName, amount) => {
  return sendTelegram(`🔴 <b>Payment FAILED</b>\nAmount: ₹${amount}\nCustomer: ${escapeHtml(customerName)}\nReview in dashboard.`);
};

const sendLowStockAlert = (phone, productName, stock) => {
  return sendTelegram(`⚠️ <b>LOW STOCK ALERT</b>\nProduct: ${escapeHtml(productName)}\nRemaining: ${stock} units\nRestock immediately.`);
};

const sendServerErrorAlert = (errorMsg) => {
  return sendTelegram(`🔥 <b>SERVER ERROR</b>\nMsg: ${escapeHtml(errorMsg)}`);
};

const sendStaffAlert = (message) => {
  return sendTelegram(`👨‍🍳 <b>Staff Alert:</b> ${escapeHtml(message)}`);
};

// For backward compatibility, also export the old name
const sendInternalOrderAlertWithCustomDetails = sendInternalOrderAlert;

module.exports = {
  escapeHtml,
  formatOrderItem,
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
