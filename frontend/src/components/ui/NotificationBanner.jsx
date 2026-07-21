import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMessaging, getToken, deleteToken } from "firebase/messaging";

const NotificationBanner = () => {
  const { user, syncFcmToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Read dismissal preference from sessionStorage so dismissing persists during session
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('notification_banner_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('notification_banner_dismissed', 'true');
    } catch (e) {}
  };

  // Safe Environment Guard checking if window, notification API exist
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  const [permissionState, setPermissionState] = useState(
    isSupported ? window.Notification?.permission : 'denied'
  );

  useEffect(() => {
    if (isSupported && window.Notification) {
      setPermissionState(window.Notification.permission);
    }
  }, [isSupported]);

  // Derive target states safely
  const hasPermission = permissionState === 'granted';
  const hasFcmToken = user?.fcmTokens && user.fcmTokens.length > 0;
  const isBlocked = permissionState === 'denied';

  // Show banner if not dismissed, user logged in, and notification isn't configured
  const showBanner = !dismissed && user && (!hasPermission || !hasFcmToken);

  // 1. AUTO-ATTEMPT BACKGROUND SYNC ON PAGE LOAD (Silent Migration)
  useEffect(() => {
    if (!isSupported || !user || !hasPermission || hasFcmToken || !('serviceWorker' in navigator)) return;

    const silentMigration = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const messaging = getMessaging();

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token && typeof syncFcmToken === 'function') {
          await syncFcmToken(token);
        }
      } catch (error) {
        console.warn('Silent mobile background token re-sync skipped/failed:', error.message);
      }
    };

    silentMigration();
  }, [hasPermission, hasFcmToken, user, isSupported, syncFcmToken]);

  // If user is not logged in or environment doesn't support notifications or banner is hidden, render nothing
  if (!user || !isSupported || !showBanner) return null;

  // 2. EXPLICIT INTERACTION HANDLER
  const handleEnable = async () => {
    try {
      setIsLoading(true);

      // Request native browser system-level permission
      const result = await window.Notification.requestPermission();
      setPermissionState(result);

      if (result === 'granted') {
        // Attempt FCM Token registration if serviceWorker supported
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const messaging = getMessaging();

            try { await deleteToken(messaging); } catch (e) {}

            const subscription = await registration.pushManager.getSubscription();
            if (subscription) { await subscription.unsubscribe(); }

            const freshToken = await getToken(messaging, {
              vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
              serviceWorkerRegistration: registration,
            });

            if (freshToken && typeof syncFcmToken === 'function') {
              await syncFcmToken(freshToken);
            }
          } catch (fcmErr) {
            console.warn("FCM registration warning:", fcmErr?.message || fcmErr);
          }
        }

        toast.success("🎉 Notifications enabled! You'll receive real-time updates for orders and delivery.");
        handleDismiss();
      } else if (result === 'denied') {
        toast.error(
          "Notifications are blocked. Please click the lock icon (🔒) on your URL bar to allow notifications.",
          { duration: 8000 }
        );
      } else {
        toast.error("Please allow notification permissions when prompted.");
      }
    } catch (err) {
      toast.error("Failed to enable background notifications.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full bg-[#381A14] text-white min-h-[44px] flex items-center justify-center border-b border-white/10 transition-all duration-300 py-2 sm:py-1 z-[210]">
      <div className="w-full max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-white/10 p-1.5 rounded-full text-[#D4A017] shrink-0 animate-pulse">
            <Bell size={14} />
          </div>
          <div className="text-left text-[11px] sm:text-xs font-semibold leading-snug">
            {isBlocked ? (
              <>
                <span className="font-black uppercase tracking-wider text-red-400 mr-1.5">⚠️ Notifications Blocked:</span>
                <span className="hidden md:inline text-white/90">Please enable notifications in your browser settings to receive order updates, delivery tracking, and special offers.</span>
                <span className="inline md:hidden text-white/90">Enable in browser settings for order updates.</span>
              </>
            ) : (
              <>
                <span className="font-black uppercase tracking-wider text-[#D4A017] mr-1.5">🔔 Enable Notifications:</span>
                <span className="hidden md:inline text-white/90">Get real-time updates for order confirmation, out for delivery, delivered status, offers and product updates.</span>
                <span className="inline md:hidden text-white/90">Get real-time order status and delivery updates.</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isBlocked ? (
            <a
              href="https://support.google.com/chrome/answer/3220216"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-[#381A14] hover:bg-white/95 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all duration-300 active:scale-95 shadow-sm"
            >
              How to Enable
            </a>
          ) : (
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="bg-white text-[#381A14] hover:bg-white/95 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all duration-300 active:scale-95 disabled:opacity-50 shrink-0 shadow-sm cursor-pointer"
            >
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white text-sm px-2 py-1 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;