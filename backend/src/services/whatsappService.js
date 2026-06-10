'use strict';

const axios = require('axios');
const { formatPhone } = require('../utils/phoneUtil');
const logger = require('../utils/logger');

// =============================================================================
// Phone Number Normalization Helper
// =============================================================================

/**
 * Normalizes phone number for Whapi.Cloud format (919876543210)
 * - Removes spaces
 * - Removes special characters
 * - Removes leading '+'
 * - Ensures format becomes 919876543210
 * 
 * @param {string} phone - Raw phone number
 * @returns {string|null} Normalized phone number or null if invalid
 */
const normalizePhoneForWhapi = (phone) => {
  let formattedPhone = formatPhone(phone);
  if (!formattedPhone) return null;
  
  // Remove leading '+' if present
  formattedPhone = formattedPhone.replace('+', '');
  
  // Remove any remaining non-digit characters
  formattedPhone = formattedPhone.replace(/\D/g, '');
  
  // Ensure India country code if 10 digits
  if (formattedPhone.length === 10) {
    formattedPhone = `91${formattedPhone}`;
  }
  
  return formattedPhone || null;
};

// =============================================================================
// Primary WhatsApp Provider: Whapi.Cloud
// =============================================================================

/**
 * Sends WhatsApp message using Whapi.Cloud API
 * 
 * @param {string} to - Recipient phone number
 * @param {string} message - Message text
 * @param {string} role - 'user', 'staff', 'admin'
 * @returns {Promise<{success: boolean, provider: string}>}
 */
const sendWhatsAppWhapi = async (to, message, role) => {
  const whapiToken = process.env.WHAPI_TOKEN;
  const whapiBaseUrl = process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud';
  
  if (!whapiToken) {
    logger.warn(`WhatsApp [${role}] Whapi.Cloud skipped: WHAPI_TOKEN not configured`);
    return { success: false, provider: 'whapi', error: 'Missing token' };
  }
  
  const normalizedPhone = normalizePhoneForWhapi(to);
  if (!normalizedPhone) {
    logger.warn(`WhatsApp [${role}] Whapi.Cloud skipped: invalid phone number (${to})`);
    return { success: false, provider: 'whapi', error: 'Invalid phone number' };
  }
  
  const url = `${whapiBaseUrl}/messages/text`;
  const payload = {
    to: normalizedPhone,
    body: message
  };
  const headers = {
    'Authorization': `Bearer ${whapiToken}`,
    'Content-Type': 'application/json'
  };
  
  try {
    const response = await axios.post(url, payload, { headers });
    logger.info(`WhatsApp [${role}] (Whapi.Cloud) SENT to ${normalizedPhone}`);
    return { success: true, provider: 'whapi' };
  } catch (err) {
    const errMsg = err.response?.data?.error || err.response?.data?.message || err.message;
    logger.error(`WhatsApp [${role}] Whapi.Cloud FAILED: ${errMsg}`);
    return { success: false, provider: 'whapi', error: errMsg };
  }
};

// =============================================================================
// Fallback Provider: AiSensy
// =============================================================================

const sendWhatsAppAiSensy = async (to, message, role) => {
  const apiKey = process.env.AISENSY_API_KEY;
  const campaignName = process.env.AISENSY_CAMPAIGN_NAME;
  
  if (!apiKey || !campaignName) {
    logger.warn(`WhatsApp [${role}] AiSensy skipped: API key or campaign name missing`);
    return { success: false, provider: 'aisensy' };
  }
  
  let formattedPhone = formatPhone(to);
  if (!formattedPhone) return { success: false, provider: 'aisensy' };
  
  if (!formattedPhone.startsWith('+')) formattedPhone = `+${formattedPhone}`;
  
  const apiUrl = process.env.AISENSY_API_URL || 'https://backend.aisensy.com/campaign/t1/api/v2';
  const payload = {
    apiKey,
    campaignName,
    destination: formattedPhone,
    userName: role,
    templateParams: [message]
  };
  
  try {
    await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' } });
    logger.info(`WhatsApp [${role}] (AiSensy) SENT to ${formattedPhone}`);
    return { success: true, provider: 'aisensy' };
  } catch (err) {
    const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    logger.error(`WhatsApp [${role}] AiSensy FAILED: ${errMsg}`);
    return { success: false, provider: 'aisensy', error: errMsg };
  }
};

// =============================================================================
// Fallback Provider: CallMeBot
// =============================================================================

const sendWhatsAppCallMeBot = async (to, message, role) => {
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!apikey) {
    logger.warn(`WhatsApp [${role}] CallMeBot skipped: API key missing`);
    return { success: false, provider: 'callmebot' };
  }
  
  let formattedPhone = formatPhone(to);
  if (formattedPhone) {
    formattedPhone = formattedPhone.replace('+', '');
    if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
      formattedPhone = formattedPhone.substring(2);
    }
  }
  if (!formattedPhone || formattedPhone.length !== 10) {
    logger.warn(`WhatsApp [${role}] CallMeBot skipped: invalid phone number`);
    return { success: false, provider: 'callmebot' };
  }
  
  const url = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodeURIComponent(message)}&apikey=${apikey}`;
  try {
    await axios.get(url);
    logger.info(`WhatsApp [${role}] (CallMeBot) SENT`);
    return { success: true, provider: 'callmebot' };
  } catch (err) {
    const errMsg = err.response?.data?.error || err.message;
    logger.error(`WhatsApp [${role}] CallMeBot FAILED: ${errMsg}`);
    return { success: false, provider: 'callmebot', error: errMsg };
  }
};

// =============================================================================
// Main WhatsApp Dispatcher with Provider Selection
// =============================================================================

const sendWhatsApp = async (to, message, role = 'unknown') => {
  const provider = process.env.NOTIFICATION_PROVIDER || 'whapi';
  logger.info(`WhatsApp [${role}] Using provider: ${provider}`);
  
  try {
    let result;
    switch (provider) {
      case 'aisensy':
        result = await sendWhatsAppAiSensy(to, message, role);
        break;
      case 'callmebot':
        result = await sendWhatsAppCallMeBot(to, message, role);
        break;
      default:
        result = await sendWhatsAppWhapi(to, message, role);
        break;
    }
    if (!result.success) {
      logger.warn(`WhatsApp [${role}] ${provider} failed`);
    }
  } catch (err) {
    logger.error(`WhatsApp [${role}] Unexpected error: ${err.message}`);
  }
};

// =============================================================================
// Helper: Format item for ADMIN (full details including custom cake)
// =============================================================================
const formatAdminOrderItem = (item) => {
  if (item.isCustomCake && item.customDetails) {
    const cd = item.customDetails;
    let details = `🎨 *${item.name}* (x${item.qty})\n`;
    if (cd.designTheme) details += `   Theme: ${cd.designTheme}\n`;
    if (cd.flavour) details += `   Flavor: ${cd.flavour}\n`;
    if (cd.weight) details += `   Weight: ${cd.weight}\n`;
    if (cd.messageOnCake) {
      let cleaned = cd.messageOnCake.trim();
      const match = cleaned.match(/Message:\s*(.*)$/i);
      if (match && match[1] && match[1] !== 'None') details += `   🎂 Message: ${match[1].trim()}\n`;
    }
    return details.trim();
  }
  return `🍰 ${item.name} (x${item.qty})`;
};

// =============================================================================
// Helper: Format item for CUSTOMER (simple: name + qty only)
// =============================================================================
const formatCustomerOrderItem = (item) => {
  return `${item.name} (x${item.qty})`;
};

// =============================================================================
// USER Notifications (Customer) - SIMPLE, no custom cake details
// =============================================================================

/**
 * Order placed confirmation – simple, with a thank you message.
 */
const sendOrderPlaced = (phone, orderNumber, order = null) => {
  if (order && order.address && order.items) {
    const itemsList = order.items.map(item => formatCustomerOrderItem(item)).join(', ');
    const message = `🍫 *Order Confirmed!*\n\n` +
      `🆔 *Order ID:* ${order.orderNumber}\n` +
      `👤 *Name:* ${order.address.fullName}\n` +
      `📞 *Phone:* ${order.address.phone}\n` +
      `🍰 *Items:* ${itemsList}\n` +
      `💰 *Total:* ₹${order.total}\n` +
      `📅 *Delivery:* ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'} ${order.deliverySlot ? `(${order.deliverySlot})` : ''}\n\n` +
      `Thank you for choosing The Chocolate Mine! 🎉\n` +
      `We'll keep you updated on your order status.`;
    return sendWhatsApp(phone, message, 'user');
  }
  const message = `🍫 *Order Confirmed!*\n✅ Your order *${orderNumber}* has been placed successfully.\n\nThank you for choosing The Chocolate Mine! 🎉`;
  return sendWhatsApp(phone, message, 'user');
};

/**
 * Order out for delivery notification
 */
const sendOutForDelivery = (phone, orderNumber) => {
  const message = `🍫 *Order Update*\n\n` +
    `🆔 Order: *${orderNumber}*\n` +
    `🚚 Status: *Out for Delivery*\n\n` +
    `Your order is on its way! 🚛\n` +
    `Thank you for choosing The Chocolate Mine!`;
  return sendWhatsApp(phone, message, 'user');
};

/**
 * Order delivered notification – includes invoice reference.
 */
const sendDelivered = (phone, orderNumber) => {
  const message = `🍫 *Order Delivered*\n\n` +
    `🆔 Order: *${orderNumber}*\n` +
    `✅ Status: *Delivered*\n\n` +
    `We hope you enjoyed your cake! 🍰\n` +
    `Your invoice has been sent to your registered email.\n\n` +
    `Thank you for choosing The Chocolate Mine! 🎉`;
  return sendWhatsApp(phone, message, 'user');
};

/**
 * Invoice ready notification (links to email)
 */
const sendInvoiceReady = (phone, orderNumber) => {
  const message = `🍫 *Invoice Ready*\n\n` +
    `🆔 Order: *${orderNumber}*\n` +
    `📧 Invoice sent to your registered email.\n\n` +
    `Thank you for shopping with us!`;
  return sendWhatsApp(phone, message, 'user');
};

// Optional: keep simple status functions for consistency
const sendPreparing = (phone, orderNumber) => {
  const message = `🍫 *Order Update*\n\n🆔 Order: *${orderNumber}*\n👨‍🍳 Status: *Being Prepared*\n\nYour delicious cake is being prepared in our kitchen. 🍰`;
  return sendWhatsApp(phone, message, 'user');
};

const sendPacked = (phone, orderNumber) => {
  const message = `🍫 *Order Update*\n\n🆔 Order: *${orderNumber}*\n📦 Status: *Packed & Ready*\n\nYour order is ready for dispatch! 🎁`;
  return sendWhatsApp(phone, message, 'user');
};

const sendPaymentFailure = (phone, amount, customerName) => {
  const message = `🔴 *Payment Failed*\n\nDear ${customerName || 'Customer'},\n\nYour payment of ₹${amount} could not be processed.\nPlease retry or contact support.`;
  return sendWhatsApp(phone, message, 'user');
};

// =============================================================================
// ADMIN Notifications – FULL details including custom cakes
// =============================================================================

const sendInternalOrderAlert = (to, order) => {
  const itemsList = order.items.map(item => formatAdminOrderItem(item)).join('\n');
  const address = `${order.address.fullName}, ${order.address.houseNo}, ${order.address.street}, ${order.address.city} - ${order.address.pincode}`;
  
  const message = `🍫 *New Order Received*\n\n` +
    `🆔 *Order ID:* ${order.orderNumber}\n` +
    `👤 *Customer Name:* ${order.address.fullName}\n` +
    `📞 *Customer Phone:* ${order.address.phone}\n` +
    `📍 *Full Address:* ${address}\n` +
    `🍰 *Ordered Items:*\n${itemsList}\n` +
    `💰 *Total Amount:* ₹${order.total}\n` +
    `📅 *Delivery Date:* ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}\n` +
    `⏰ *Delivery Slot:* ${order.deliverySlot || 'N/A'}\n` +
    `📅 *Ordered Time:* ${new Date(order.createdAt).toLocaleString()}\n\n` +
    `Please check admin dashboard now.`;
  return sendWhatsApp(to, message, 'admin');
};

const sendAdminNewOrder = (adminPhone, orderNumber, total) => {
  const message = `📥 *New Order Alert*\nOrder ID: *${orderNumber}*\nTotal: ₹${total}\nCheck admin dashboard.`;
  return sendWhatsApp(adminPhone, message, 'admin');
};

const sendHighValueAlert = (adminPhone, orderNumber, total) => {
  const message = `⚠️ *HIGH VALUE ORDER*\nOrder: ${orderNumber}\nAmount: ₹${total}\n🔴 Immediate review recommended!`;
  return sendWhatsApp(adminPhone, message, 'admin');
};

const sendAdminPaymentFailure = (adminPhone, customerName, amount) => {
  const message = `🔴 *Payment Failed Alert*\nCustomer: ${customerName}\nAmount: ₹${amount}\n⚠️ Please review in dashboard.`;
  return sendWhatsApp(adminPhone, message, 'admin');
};

const sendLowStockAlert = (adminPhone, productName, stock) => {
  const message = `⚠️ *Low Stock Alert*\nProduct: *${productName}*\nRemaining: ${stock} units\n🔄 Restock immediately!`;
  return sendWhatsApp(adminPhone, message, 'admin');
};

// =============================================================================
// STAFF Notifications (kept simple)
// =============================================================================

const sendKitchenAlert = (staffPhone, orderNumber) => {
  const message = `🍴 *Kitchen Alert*\nNew order *${orderNumber}* received.\nPlease check dashboard.`;
  return sendWhatsApp(staffPhone, message, 'staff');
};

const sendUrgentSlotAlert = (staffPhone, orderNumber, slot) => {
  const message = `⚡ *URGENT: Same Slot Order*\nOrder: ${orderNumber}\nSlot: ${slot}\nImmediate attention required!`;
  return sendWhatsApp(staffPhone, message, 'staff');
};

// =============================================================================
// Exports
// =============================================================================

module.exports = {
  sendWhatsApp,

  // Customer notifications (simple)
  sendOrderPlaced,
  sendOutForDelivery,
  sendDelivered,
  sendInvoiceReady,
  sendPreparing,      // optional, can be used if you want 3‑status flow
  sendPacked,
  sendPaymentFailure,

  // Admin notifications (full details)
  sendInternalOrderAlert,
  sendAdminNewOrder,
  sendHighValueAlert,
  sendAdminPaymentFailure,
  sendPaymentFailed: sendAdminPaymentFailure,
  sendLowStockAlert,

  // Staff notifications
  sendKitchenAlert,
  sendUrgentSlotAlert
};