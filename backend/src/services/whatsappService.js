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
  
  // Debug logging
  console.log(`🔵 [WHAPI] Attempting to send to ${role} at ${to}`);
  
  if (!whapiToken) {
    logger.warn(`WhatsApp [${role}] Whapi.Cloud skipped: WHAPI_TOKEN not configured`);
    console.log(`🔴 [WHAPI] FAILED: Missing WHAPI_TOKEN`);
    return { success: false, provider: 'whapi', error: 'Missing token' };
  }
  
  // Normalize phone number for Whapi format
  const normalizedPhone = normalizePhoneForWhapi(to);
  if (!normalizedPhone) {
    logger.warn(`WhatsApp [${role}] Whapi.Cloud skipped: invalid phone number (${to})`);
    console.log(`🔴 [WHAPI] FAILED: Invalid phone number ${to}`);
    return { success: false, provider: 'whapi', error: 'Invalid phone number' };
  }
  
  console.log(`🔵 [WHAPI] Normalized phone: ${normalizedPhone}`);
  
  const url = `${whapiBaseUrl}/messages/text`;
  const payload = {
    to: normalizedPhone,
    body: message
  };
  const headers = {
    'Authorization': `Bearer ${whapiToken}`,
    'Content-Type': 'application/json'
  };
  
  console.log(`🔵 [WHAPI] Sending to URL: ${url}`);
  
  try {
    const response = await axios.post(url, payload, { headers });
    console.log(`🟢 [WHAPI] SUCCESS! Response:`, response.status);
    logger.info(`WhatsApp [${role}] (Whapi.Cloud) SENT to ${normalizedPhone}`);
    return { success: true, provider: 'whapi' };
  } catch (err) {
    const statusCode = err.response?.status;
    const errMsg = err.response?.data?.error || err.response?.data?.message || err.message;
    
    console.log(`🔴 [WHAPI] FAILED! Status: ${statusCode}, Error: ${errMsg}`);
    
    if (statusCode === 401) {
      logger.error(`WhatsApp [${role}] Whapi.Cloud FAILED: Invalid/Expired token`);
    } else if (statusCode === 400) {
      logger.error(`WhatsApp [${role}] Whapi.Cloud FAILED: Bad request - check phone number format`);
    } else {
      logger.error(`WhatsApp [${role}] Whapi.Cloud FAILED: ${errMsg}`);
    }
    
    return { success: false, provider: 'whapi', error: errMsg };
  }
};

// =============================================================================
// Fallback Provider: AiSensy
// =============================================================================

/**
 * Sends WhatsApp message using AiSensy Campaign API
 * 
 * @param {string} to - Recipient phone number
 * @param {string} message - Message text
 * @param {string} role - 'user', 'staff', 'admin'
 * @returns {Promise<{success: boolean, provider: string}>}
 */
const sendWhatsAppAiSensy = async (to, message, role) => {
  const apiKey = process.env.AISENSY_API_KEY;
  const campaignName = process.env.AISENSY_CAMPAIGN_NAME;
  
  console.log(`🔵 [AISENSY] Attempting to send to ${role}`);
  
  if (!apiKey || !campaignName) {
    logger.warn(`WhatsApp [${role}] AiSensy skipped: API key or campaign name missing`);
    return { success: false, provider: 'aisensy' };
  }
  
  let formattedPhone = formatPhone(to);
  if (!formattedPhone) {
    logger.warn(`WhatsApp [${role}] AiSensy skipped: invalid phone number (${to})`);
    return { success: false, provider: 'aisensy' };
  }
  
  // Ensure the number starts with '+'
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+${formattedPhone}`;
  }
  
  const apiUrl = process.env.AISENSY_API_URL || 'https://backend.aisensy.com/campaign/t1/api/v2';
  
  const payload = {
    apiKey: apiKey,
    campaignName: campaignName,
    destination: formattedPhone,
    userName: role,
    templateParams: [message]
  };
  
  try {
    await axios.post(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`🟢 [AISENSY] SUCCESS!`);
    logger.info(`WhatsApp [${role}] (AiSensy) SENT to ${formattedPhone}`);
    return { success: true, provider: 'aisensy' };
  } catch (err) {
    const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.log(`🔴 [AISENSY] FAILED: ${errMsg}`);
    logger.error(`WhatsApp [${role}] AiSensy FAILED: ${errMsg}`);
    return { success: false, provider: 'aisensy', error: errMsg };
  }
};

// =============================================================================
// Fallback Provider: CallMeBot
// =============================================================================

/**
 * Sends WhatsApp message using CallMeBot API
 * 
 * @param {string} to - Recipient phone number
 * @param {string} message - Message text
 * @param {string} role - 'user', 'staff', 'admin'
 * @returns {Promise<{success: boolean, provider: string}>}
 */
const sendWhatsAppCallMeBot = async (to, message, role) => {
  const apikey = process.env.CALLMEBOT_APIKEY;
  
  console.log(`🔵 [CALLMEBOT] Attempting to send to ${role}`);
  
  if (!apikey) {
    logger.warn(`WhatsApp [${role}] CallMeBot skipped: API key missing`);
    return { success: false, provider: 'callmebot' };
  }
  
  let formattedPhone = formatPhone(to);
  if (formattedPhone) {
    formattedPhone = formattedPhone.replace('+', '');
    // Ensure 10-digit number for CallMeBot (remove country code if present)
    if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
      formattedPhone = formattedPhone.substring(2);
    }
  }
  
  if (!formattedPhone || formattedPhone.length !== 10) {
    logger.warn(`WhatsApp [${role}] CallMeBot skipped: invalid phone number (${to})`);
    return { success: false, provider: 'callmebot' };
  }
  
  const url = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodeURIComponent(message)}&apikey=${apikey}`;
  
  try {
    await axios.get(url);
    console.log(`🟢 [CALLMEBOT] SUCCESS!`);
    logger.info(`WhatsApp [${role}] (CallMeBot) SENT`);
    return { success: true, provider: 'callmebot' };
  } catch (err) {
    const errMsg = err.response?.data?.error || err.message;
    console.log(`🔴 [CALLMEBOT] FAILED: ${errMsg}`);
    logger.error(`WhatsApp [${role}] CallMeBot FAILED: ${errMsg}`);
    return { success: false, provider: 'callmebot', error: errMsg };
  }
};

// =============================================================================
// Main WhatsApp Dispatcher with Provider Selection
// =============================================================================

/**
 * Main WhatsApp dispatcher that uses Whapi.Cloud as primary provider
 * with AiSensy and CallMeBot as optional fallbacks
 * 
 * @param {string} to - Recipient phone number
 * @param {string} message - Message text
 * @param {string} role - 'user', 'staff', 'admin'
 * @returns {Promise<void>}
 */
const sendWhatsApp = async (to, message, role = 'unknown') => {
  const provider = process.env.NOTIFICATION_PROVIDER || 'whapi';
  
  console.log(`📱 [WHATSAPP] Using provider: ${provider} for ${role}`);
  logger.info(`WhatsApp [${role}] Using provider: ${provider}`);
  
  try {
    let result;
    
    // Route to selected provider
    switch (provider) {
      case 'aisensy':
        result = await sendWhatsAppAiSensy(to, message, role);
        break;
      case 'callmebot':
        result = await sendWhatsAppCallMeBot(to, message, role);
        break;
      case 'whapi':
      default:
        result = await sendWhatsAppWhapi(to, message, role);
        break;
    }
    
    if (!result.success) {
      console.log(`⚠️ [WHATSAPP] ${provider} failed for ${role}: ${result.error || 'Unknown error'}`);
      logger.warn(`WhatsApp [${role}] ${provider} failed, no fallback configured`);
    } else {
      console.log(`✅ [WHATSAPP] Successfully sent via ${provider} to ${role}`);
    }
    
  } catch (err) {
    // Catch any unexpected errors to ensure WhatsApp never breaks the main flow
    console.log(`💥 [WHATSAPP] Unexpected error for ${role}: ${err.message}`);
    logger.error(`WhatsApp [${role}] Unexpected error: ${err.message}`);
    // Silently fail - never break the order flow
  }
};

// =============================================================================
// USER Notifications (Customer) - NOW WITH FULL ORDER DETAILS
// =============================================================================

/**
 * Rich customer order placed notification with complete order details
 * Same format as admin notification
 */
const sendOrderPlaced = (phone, orderNumber, order = null) => {
  console.log(`📦 Sending order placed notification to ${phone}`);
  
  // If order object is provided, send detailed message
  if (order && order.address && order.items) {
    const itemsList = order.items.map(item => `${item.name} (x${item.qty})`).join(', ');
    const address = `${order.address.fullName}, ${order.address.houseNo}, ${order.address.street}, ${order.address.city} - ${order.address.pincode}`;
    
    const message = `🍫 *New Order Received*\n\n` +
      `🆔 *Order ID:* ${order.orderNumber}\n` +
      `👤 *Customer Name:* ${order.address.fullName}\n` +
      `📞 *Customer Phone:* ${order.address.phone}\n` +
      `📍 *Full Address:* ${address}\n` +
      `🍰 *Ordered Items:* ${itemsList}\n` +
      `💰 *Total Amount:* ₹${order.total}\n` +
      `📅 *Delivery Date:* ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}\n` +
      `⏰ *Delivery Slot:* ${order.deliverySlot || 'N/A'}\n` +
      `📅 *Ordered Time:* ${new Date(order.createdAt).toLocaleString()}\n\n` +
      `Thank you for choosing The Chocolate Mine! 🎉`;
    
    return sendWhatsApp(phone, message, 'user');
  }
  
  // Fallback to simple message if order object not provided
  const message = `🍫 *Order Confirmed!*\n\n` +
    `✅ Your order *${orderNumber}* has been placed successfully.\n\n` +
    `Thank you for choosing The Chocolate Mine! 🎉`;
  return sendWhatsApp(phone, message, 'user');
};

/**
 * Rich internal order alert for admin (matches Telegram template exactly)
 */
const sendInternalOrderAlert = (to, order) => {
  const itemsList = order.items.map(item => `${item.name} (x${item.qty})`).join(', ');
  const address = `${order.address.fullName}, ${order.address.houseNo}, ${order.address.street}, ${order.address.city} - ${order.address.pincode}`;
  
  const message = `🍫 *New Order Received*\n\n` +
    `🆔 *Order ID:* ${order.orderNumber}\n` +
    `👤 *Customer Name:* ${order.address.fullName}\n` +
    `📞 *Customer Phone:* ${order.address.phone}\n` +
    `📍 *Full Address:* ${address}\n` +
    `🍰 *Ordered Items:* ${itemsList}\n` +
    `💰 *Total Amount:* ₹${order.total}\n` +
    `📅 *Delivery Date:* ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}\n` +
    `⏰ *Delivery Slot:* ${order.deliverySlot || 'N/A'}\n` +
    `📅 *Ordered Time:* ${new Date(order.createdAt).toLocaleString()}\n\n` +
    `Please check admin dashboard now.`;
  
  return sendWhatsApp(to, message, 'admin');
};

const sendPreparing = (phone, orderNumber) => {
  const message = `🍫 *Order Update*\n\n` +
    `🆔 Order: *${orderNumber}*\n` +
    `👨‍🍳 Status: *Being Prepared*\n\n` +
    `Your delicious cake is being prepared in our kitchen. 🍰`;
  return sendWhatsApp(phone, message, 'user');
};

const sendPacked = (phone, orderNumber) => {
  const message = `🍫 *Order Update*\n\n` +
    `🆔 Order: *${orderNumber}*\n` +
    `📦 Status: *Packed & Ready*\n\n` +
    `Your order has been packed and is ready for dispatch! 🎁`;
  return sendWhatsApp(phone, message, 'user');
};

const sendOutForDelivery = (phone, orderNumber) => {
  const message = `🍫 *Order Update*\n\n` +
    `🆔 Order: *${orderNumber}*\n` +
    `🚚 Status: *Out for Delivery*\n\n` +
    `Our delivery partner is on the way with your order! 🚛`;
  return sendWhatsApp(phone, message, 'user');
};

const sendDelivered = (phone, orderNumber) => {
  const message = `🍫 *Order Delivered*\n\n` +
    `🆔 Order: *${orderNumber}*\n` +
    `✅ Status: *Delivered*\n\n` +
    `Thank you for choosing The Chocolate Mine! 🎉\n` +
    `We hope you enjoy your cake! 🍰`;
  return sendWhatsApp(phone, message, 'user');
};

const sendInvoiceReady = (phone, orderNumber) => {
  const message = `🍫 *Invoice Ready*\n\n` +
    `🆔 Order: *${orderNumber}*\n` +
    `📧 Your invoice has been sent to your registered email address.\n\n` +
    `Thank you for shopping with us!`;
  return sendWhatsApp(phone, message, 'user');
};

const sendPaymentFailure = (phone, amount, customerName) => {
  const message = `🔴 *Payment Failed*\n\n` +
    `Dear ${customerName || 'Customer'},\n\n` +
    `Your payment of ₹${amount} could not be processed.\n\n` +
    `Please retry or contact support for assistance.`;
  return sendWhatsApp(phone, message, 'user');
};

// =============================================================================
// STAFF Notifications
// =============================================================================

const sendKitchenAlert = (staffPhone, orderNumber) => {
  const message = `🍴 *Kitchen Alert*\n\n` +
    `New order *${orderNumber}* received.\n\n` +
    `Please check dashboard and begin preparation.`;
  return sendWhatsApp(staffPhone, message, 'staff');
};

const sendUrgentSlotAlert = (staffPhone, orderNumber, slot) => {
  const message = `⚡ *URGENT: Same Slot Order*\n\n` +
    `Order: *${orderNumber}*\n` +
    `Time Slot: *${slot}*\n\n` +
    `⚠️ Immediate attention required!`;
  return sendWhatsApp(staffPhone, message, 'staff');
};

// =============================================================================
// ADMIN Notifications
// =============================================================================

const sendAdminNewOrder = (adminPhone, orderNumber, total) => {
  const message = `📥 *New Order Alert*\n\n` +
    `Order ID: *${orderNumber}*\n` +
    `Total: ₹${total}\n\n` +
    `Check admin dashboard for details.`;
  return sendWhatsApp(adminPhone, message, 'admin');
};

const sendHighValueAlert = (adminPhone, orderNumber, total) => {
  const message = `⚠️ *HIGH VALUE ORDER*\n\n` +
    `Order: *${orderNumber}*\n` +
    `Amount: ₹${total}\n\n` +
    `🔴 Immediate review recommended!`;
  return sendWhatsApp(adminPhone, message, 'admin');
};

const sendAdminPaymentFailure = (adminPhone, customerName, amount) => {
  const message = `🔴 *Payment Failed Alert*\n\n` +
    `Customer: ${customerName}\n` +
    `Amount: ₹${amount}\n\n` +
    `⚠️ Please review in dashboard.`;
  return sendWhatsApp(adminPhone, message, 'admin');
};

const sendPaymentFailed = sendAdminPaymentFailure;

const sendLowStockAlert = (adminPhone, productName, stock) => {
  const message = `⚠️ *Low Stock Alert*\n\n` +
    `Product: *${productName}*\n` +
    `Remaining: ${stock} units\n\n` +
    `🔄 Restock immediately!`;
  return sendWhatsApp(adminPhone, message, 'admin');
};

// =============================================================================
// Exports
// =============================================================================

module.exports = {
  sendWhatsApp,

  // User (Customer)
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
