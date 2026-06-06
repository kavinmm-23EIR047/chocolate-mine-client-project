const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Initialize Firebase Admin SDK
// The user needs to provide the service account credentials in the .env file
// or via a service account JSON file.
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

const User = require('../models/User');

/**
 * Sends a push notification via Firebase Cloud Messaging (FCM).
 * @param {string|string[]} tokenOrTokens - The recipient's FCM device token(s).
 * @param {string} title - Notification title.
 * @param {string} body - Notification body text.
 * @param {Object} data - Optional extra data payload (key-value strings).
 */
const sendPushNotification = async (tokenOrTokens, title, body, data = {}) => {
  if (!admin.apps.length) {
    logger.warn('Push notification skipped: Firebase Admin not initialized.');
    return;
  }

  const tokens = Array.isArray(tokenOrTokens) ? tokenOrTokens : [tokenOrTokens];
  const validTokens = tokens.filter(t => t);

  if (validTokens.length === 0) {
    logger.warn('Push notification skipped: No valid FCM tokens provided.');
    return;
  }

  const message = {
    notification: { title, body },
    data,
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
          }
        }
      });

      if (failedTokens.length > 0) {
        // Clean up invalid tokens from User model
        await User.updateMany(
          { fcmTokens: { $in: failedTokens } },
          { $pull: { fcmTokens: { $in: failedTokens } } }
        );
        logger.info(`Cleaned up ${failedTokens.length} invalid FCM tokens.`);
      }
    }
  } catch (error) {
    logger.error('Error sending push notification:', error.message);
  }
};

module.exports = {
  sendPushNotification,
  sendMulticastPushNotification: sendPushNotification // Alias for backward compatibility
};
