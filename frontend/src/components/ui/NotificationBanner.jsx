import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const NotificationBanner = () => {
  const { user, syncFcmToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // If user is not logged in, do not show the banner
  if (!user) return null;

  const hasPermission = 'Notification' in window && Notification.permission === 'granted';
  const hasFcmToken = user.fcmTokens && user.fcmTokens.length > 0;

  // Show banner only if permission is not granted OR user has no FCM tokens registered
  const showBanner = !hasPermission || !hasFcmToken;

  if (!showBanner) return null;

  const handleEnable = async () => {
    try {
      setIsLoading(true);
      await syncFcmToken();
      if ('Notification' in window && Notification.permission === 'granted') {
        toast.success("Notifications enabled successfully!");
      } else {
        toast.error("Please allow notification permissions in your browser settings.");
      }
    } catch (err) {
      toast.error("Failed to enable notifications.");
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
            <span className="font-black uppercase tracking-wider text-[#D4A017] mr-1.5">🔔 Enable Notifications:</span>
            <span className="hidden md:inline text-white/90">Get real-time updates for order confirmation, out for delivery, delivered status, offers and product updates.</span>
            <span className="inline md:hidden text-white/90">Get real-time order status and delivery updates.</span>
          </div>
        </div>
        <button
          onClick={handleEnable}
          disabled={isLoading}
          className="bg-white text-[#381A14] hover:bg-white/95 text-[10px] font-black uppercase tracking-widest px-4.5 py-2 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 shrink-0 shadow-premium"
        >
          {isLoading ? 'Enabling...' : 'Enable Notifications'}
        </button>
      </div>
    </div>
  );
};

export default NotificationBanner;
