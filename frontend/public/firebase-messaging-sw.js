/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDEx-sUHYz6ir6RtwR75s09BGnLccWhnGM",
  authDomain: "chocolate-mine.firebaseapp.com",
  projectId: "chocolate-mine",
  storageBucket: "chocolate-mine.firebasestorage.app",
  messagingSenderId: "667672016435",
  appId: "1:667672016435:web:8831bf4580d85ec39d1546"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages (when tab is closed or app not focused)
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const title = payload.notification?.title || payload.data?.title || 'The Chocolate Mine';
    const body = payload.notification?.body || payload.data?.message || 'You have a new notification';
    const data = payload.data || {};

    // Determine icon based on notification type
    let icon = '/logo.png';
    let badge = '/favicon.svg';

    const notificationOptions = {
      body,
      icon,
      badge,
      tag: data.type || 'general', // Prevents duplicate notifications of same type
      renotify: true,
      requireInteraction: false,
      data: {
        url: data.url || '/',
        type: data.type || 'general',
        orderId: data.orderId || null,
        productId: data.productId || null
      },
      actions: []
    };

    // Add contextual actions based on type
    if (data.type && data.type.includes('order')) {
      notificationOptions.actions = [
        { action: 'view', title: '👀 View Order' }
      ];
    } else if (data.type && (data.type.includes('product') || data.type.includes('stock') || data.type.includes('offer'))) {
      notificationOptions.actions = [
        { action: 'view', title: '🛍️ View Product' }
      ];
    }

    self.registration.showNotification(title, notificationOptions);
  });

  // Handle notification click
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    let targetUrl = data.url || '/';

    // Handle action buttons
    if (event.action === 'view') {
      targetUrl = data.url || '/';
    }

    // Ensure full URL
    if (!targetUrl.startsWith('http')) {
      targetUrl = self.location.origin + targetUrl;
    }

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // Try to focus an existing window
        for (const client of windowClients) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // Try to navigate an existing window
        for (const client of windowClients) {
          if ('navigate' in client) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
        }
        // Open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  });

  // Handle notification close
  self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event.notification.tag);
  });

} catch (e) {
  console.warn('[SW] Firebase initialization failed:', e);
}
