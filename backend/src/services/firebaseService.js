const admin = require('firebase-admin');
const logger = require('../utils/logger');
const User = require('../models/User');

// Initialize Firebase Admin SDK
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    console.log("Firebase Private Key Prefix:", process.env.FIREBASE_PRIVATE_KEY.slice(0, 30));
    
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    // Strip surrounding quotes if they exist, then replace escaped newlines
    privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      })
    });
    logger.info('Firebase Admin initialized successfully.');
  } else {
    logger.warn('Firebase Admin NOT initialized: Missing FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, or FIREBASE_CLIENT_EMAIL in .env');
  }
} catch (error) {
  logger.error('Failed to initialize Firebase Admin:', error.message);
}

/**
 * Helper to clean up invalid registration tokens from User models and AdminFcmToken collection
 * @param {string[]} failedTokens - Array of invalid tokens to remove.
 */
const removeInvalidTokens = async (failedTokens) => {
  if (!failedTokens || failedTokens.length === 0) return;
  try {
    // Clean from regular users
    const userResult = await User.updateMany(
      { fcmTokens: { $in: failedTokens } },
      { $pull: { fcmTokens: { $in: failedTokens } } }
    );
    
    // Clean from admin tokens collection
    const AdminFcmToken = require('../models/AdminFcmToken');
    const adminResult = await AdminFcmToken.deleteMany(
      { token: { $in: failedTokens } }
    );

    logger.info(`Cleaned up invalid FCM tokens. Users modified: ${userResult.modifiedCount}, Admin tokens deleted: ${adminResult.deletedCount}`);
  } catch (error) {
    logger.error('Error cleaning up invalid FCM tokens:', error.message);
  }
};

/**
 * Base function to send push notifications to a list of tokens.
 * Supports retrying failed sends and cleaning up invalid tokens.
 * @param {string[]} tokens - Array of destination FCM tokens.
 * @param {string} title - Title of notification.
 * @param {string} body - Body content of notification.
 * @param {Object} data - Optional payload data (key-value string pairs).
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!admin.apps.length) {
    logger.warn('Push notification skipped: Firebase Admin not initialized.');
    return { successCount: 0, failureCount: 0 };
  }

  const validTokens = (Array.isArray(tokens) ? tokens : [tokens]).filter(t => typeof t === 'string' && t.trim() !== '');

  if (validTokens.length === 0) {
    logger.warn('Push notification skipped: No valid FCM tokens provided.');
    return { successCount: 0, failureCount: 0 };
  }

  // Ensure all data values are string pairs
  const stringifiedData = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      stringifiedData[key] = String(data[key]);
    }
  });

  const message = {
    notification: { title, body },
    data: stringifiedData,
    tokens: validTokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info(`Multicast push sent: ${response.successCount} successes, ${response.failureCount} failures.`);
    
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
            failedTokens.push(validTokens[idx]);
          } else {
            logger.warn(`FCM send failure token ${validTokens[idx].slice(0, 15)}...: ${resp.error?.message} (Code: ${errorCode})`);
          }
        }
      });

      if (failedTokens.length > 0) {
        await removeInvalidTokens(failedTokens);
      }
    }
    return response;
  } catch (error) {
    logger.error('Error sending multicast push notification:', error.message);
    return { successCount: 0, failureCount: validTokens.length };
  }
};

/**
 * Sends notification to a single user.
 */
const sendToUser = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId, 'fcmTokens');
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      logger.info(`Skipped sendToUser for ${userId}: No FCM tokens`);
      return;
    }
    return await sendPushNotification(user.fcmTokens, title, body, data);
  } catch (error) {
    logger.error(`Error in sendToUser for ${userId}:`, error.message);
  }
};

/**
 * Sends notification to all admin devices.
 */
const sendToAdmin = async (title, body, data = {}) => {
  try {
    const AdminFcmToken = require('../models/AdminFcmToken');
    const adminDocs = await AdminFcmToken.find({});
    const tokens = adminDocs.map(doc => doc.token).filter(Boolean);
    
    if (tokens.length === 0) {
      logger.info('Skipped sendToAdmin: No admin devices registered with FCM tokens');
      return;
    }
    return await sendPushNotification(tokens, title, body, data);
  } catch (error) {
    logger.error('Error in sendToAdmin:', error.message);
  }
};

/**
 * Sends notification to multiple specific users.
 */
const sendToMultipleUsers = async (userIds, title, body, data = {}) => {
  try {
    const users = await User.find({ _id: { $in: userIds } }, 'fcmTokens');
    const tokens = users.flatMap(user => user.fcmTokens || []);
    if (tokens.length === 0) {
      logger.info('Skipped sendToMultipleUsers: No target users found with FCM tokens');
      return;
    }
    return await sendPushNotification(tokens, title, body, data);
  } catch (error) {
    logger.error('Error in sendToMultipleUsers:', error.message);
  }
};

/**
 * Sends notification to all active users (broadcast).
 */
const sendBroadcast = async (title, body, data = {}) => {
  try {
    // Find all active users with role 'user'
    const users = await User.find({ role: 'user', active: true }, 'fcmTokens');
    const tokens = users.flatMap(user => user.fcmTokens || []);
    if (tokens.length === 0) {
      logger.info('Skipped sendBroadcast: No active users with FCM tokens');
      return;
    }
    return await sendPushNotification(tokens, title, body, data);
  } catch (error) {
    logger.error('Error in sendBroadcast:', error.message);
  }
};

module.exports = {
  sendPushNotification,
  sendMulticastPushNotification: sendPushNotification, // Alias
  sendToUser,
  sendToAdmin,
  sendToMultipleUsers,
  sendBroadcast,
  removeInvalidTokens
};
