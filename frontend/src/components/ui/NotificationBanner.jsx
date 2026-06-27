import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMessaging, getToken, deleteToken } from "firebase/messaging";

const NotificationBanner = () => {
  const { user, syncFcmToken } = useAuth(); // Keeping your existing context method names
  const [isLoading, setIsLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Safe Environment Guard checking if window, notification API, and service workers exist
  const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;

  const [permissionState, setPermissionState] = useState(
    isSupported ? window.Notification?.permission : 'denied'
  );

  // Derive target states safely
  const hasPermission = permissionState === 'granted';
  const hasFcmToken = user?.fcmTokens && user.fcmTokens.length > 0;
  const isBlocked = permissionState === 'denied';

  // Show banner if permission isn't granted OR user has no background-registered token stored
  const showBanner = !dismissed && user && (!hasPermission || !hasFcmToken);

  // 1. AUTO-ATTEMPT BACKGROUND SYNC ON PAGE LOAD (Silent Migration)
  useEffect(() => {
    if (!isSupported || !user || !hasPermission || hasFcmToken) return;

    const silentMigration = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const messaging = getMessaging();

        // Fetch background-compliant token mapped explicitly to the root service worker
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

  // If user is not logged in or environment doesn't support web push, render nothing
  if (!user || !isSupported || !showBanner) return null;

  // 2. EXPLICIT INTERACTION HANDLER (Force clean background binding)
  const handleEnable = async () => {
    try {
      setIsLoading(true);

      // Request native browser system-level permission
      const result = await window.Notification.requestPermission();
      setPermissionState(result);

      if (result === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const messaging = getMessaging();

        // Step A: Safely clean up stale foreground/corrupted token states
        try {
          await deleteToken(messaging);
        } catch (e) {
          console.log("No previous token registration to clear.");
        }

        // Step B: Unsubscribe push manager profiles to clear mobile OS cache
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }

        // Step C: Ask for pristine background-compliant token
        const freshToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (freshToken) {
          await syncFcmToken(freshToken);
          toast.success("🎉 Notifications enabled! You'll receive real-time updates even when the app is closed.");
          setDismissed(true);
        } else {
          throw new Error("Token generation returned blank.");
        }
      } else if (result === 'denied') {
        toast.error(
          "Notifications are blocked. Please tap the lock icon (🔒) on your URL bar to allow notifications.",
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
    <div className="w-full bg-[#381A14] text-white min-h-[46px] flex items-center justify-center sticky top-0 z-[110] shadow-md border-b border-white/10 transition-all duration-300 py-2 sm:py-0">
      <div className="w-full max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-white/10 p-1.5 rounded-full text-[#D4A017] shrink-0 animate-pulse">
            <Bell size={15} />
          </div>
          <div className="text-left text-xs font-semibold leading-snug">
            {isBlocked ? (
              <>
                <span className="font-black uppercase tracking-wider text-red-400 mr-1.5">⚠️ Notifications Blocked:</span>
                <span className="hidden md:inline text-white/90">Please enable notifications in your mobile browser settings to receive order updates, delivery tracking, and special offers.</span>
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
              className="bg-white text-[#381A14] hover:bg-white/95 text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-xl transition-all duration-300 active:scale-95 shadow-premium"
            >
              How to Enable
            </a>
          ) : (
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="bg-white text-[#381A14] hover:bg-white/95 text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 shrink-0 shadow-premium"
            >
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-white/50 hover:text-white/80 text-xs px-2 py-1 transition-colors"
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