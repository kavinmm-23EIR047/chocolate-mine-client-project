// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
// (User must set these in frontend/.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only if config exists
let app;
let messaging;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } else {
    console.warn("Firebase not initialized. Missing VITE_FIREBASE_API_KEY in .env");
  }
} catch (err) {
  console.error("Firebase init error:", err);
}

export const requestFirebaseNotificationPermission = async () => {
  if (!messaging) return null;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.error("❌ VITE_FIREBASE_VAPID_KEY is missing in frontend/.env! Browser notifications cannot be enabled.");
    alert("Configuration Error: Firebase VAPID Key is missing. Notifications cannot be enabled.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, { 
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY 
      });
      if (currentToken) {
        return currentToken;
      } else {
        console.warn('No registration token available. Request permission to generate one.');
        return null;
      }
    } else {
      console.warn('Notification permission not granted.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () => {
  if (!messaging) return new Promise((resolve) => {});
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};
