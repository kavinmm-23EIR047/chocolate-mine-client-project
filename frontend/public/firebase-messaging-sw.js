importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// This requires the user to replace the placeholders or have a build step
// that injects the env vars. For simplicity, we fallback gracefully if not configured.
const firebaseConfig = {
  apiKey: "AIzaSyDEx-sUHYz6ir6RtwR75s09BGnLccWhnGM",
  authDomain: "chocolate-mine.firebaseapp.com",
  projectId: "chocolate-mine",
  storageBucket: "chocolate-mine.firebasestorage.app",
  messagingSenderId: "667672016435",
  appId: "1:667672016435:web:8831bf4580d85ec39d1546"
};

try {
  if (firebaseConfig.apiKey !== "REPLACE_WITH_VITE_FIREBASE_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.ico',
        data: payload.data // Pass data payload to notification for click handling
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });

    self.addEventListener('notificationclick', function(event) {
      event.notification.close();
      const url = event.notification.data?.url || '/';
      
      event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
          // Check if there is already a window/tab open with the target URL
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url.includes(url) && 'focus' in client) {
              return client.focus();
            }
          }
          // If not, open a new window
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
      );
    });
  }
} catch (e) {
  console.warn("Service worker Firebase failed to initialize", e);
}
