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

/**
 * Sends a push notification via Firebase Cloud Messaging (FCM).
 * @param {string} token - The recipient's FCM device token.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body text.
 * @param {Object} data - Optional extra data payload (key-value strings).
 */
const sendPushNotification = async (token, title, body, data = {}) => {
  if (!admin.apps.length) {
    logger.warn('Push notification skipped: Firebase Admin not initialized.');
    return;
  }

  if (!token) {
    logger.warn('Push notification skipped: No FCM token provided.');
    return;
  }

  const message = {
    notification: {
      title,
      body,
    },
    data,
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    logger.info(`Push notification sent successfully. Message ID: ${response}`);
  } catch (error) {
    logger.error('Error sending push notification:', error.message);
    // If the token is invalid or unregistered, we could handle it here 
    // (e.g., by removing it from the user document).
  }
};

/**
 * Sends a multicast push notification to multiple devices.
 * @param {string[]} tokens - Array of FCM device tokens.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body text.
 * @param {Object} data - Optional extra data payload.
 */
const sendMulticastPushNotification = async (tokens, title, body, data = {}) => {
  if (!admin.apps.length) return;
  if (!tokens || tokens.length === 0) return;

  const message = {
    notification: { title, body },
    data,
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info(`Multicast push sent: ${response.successCount} successes, ${response.failureCount} failures.`);
  } catch (error) {
    logger.error('Error sending multicast push notification:', error.message);
  }
};

module.exports = {
  sendPushNotification,
  sendMulticastPushNotification
};
