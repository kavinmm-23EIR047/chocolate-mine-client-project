import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requestFirebaseNotificationPermission } from '../../firebase';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Bell, BellOff } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const NotificationPrompt = () => {
  const { user, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Auto-prompt on first load for logged-in users who haven't enabled notifications yet
    if (user && !user.fcmToken) {
      const hasSeenPrompt = localStorage.getItem('notificationPromptSeen');
      if (!hasSeenPrompt) {
        // Slight delay so it doesn't interrupt immediate page load
        const timer = setTimeout(() => setIsOpen(true), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  useEffect(() => {
    // Listen for manual triggers (e.g., from Navbar)
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openNotificationPrompt', handleOpen);
    return () => window.removeEventListener('openNotificationPrompt', handleOpen);
  }, []);

  const handleClose = () => {
    localStorage.setItem('notificationPromptSeen', '1');
    setIsOpen(false);
  };

  const handleToggleNotifications = async () => {
    try {
      setIsLoading(true);
      const isCurrentlyEnabled = !!user?.fcmToken;

      if (isCurrentlyEnabled) {
        // Disable notifications
        await api.put('/users/fcm-token', { fcmToken: null });
        updateUser({ ...user, fcmToken: null });
        toast.success("Push notifications disabled");
      } else {
        // Enable notifications
        const token = await requestFirebaseNotificationPermission();
        if (token) {
          await api.put('/users/fcm-token', { fcmToken: token });
          updateUser({ ...user, fcmToken: token });
          toast.success("Push notifications enabled");
        } else {
          toast.error("Please allow notification permissions in your browser settings.");
        }
      }
      handleClose(); // Close modal on success
    } catch (err) {
      toast.error("Failed to update notification preferences.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Notification Preferences" size="sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
          {user?.fcmToken ? <Bell size={32} /> : <BellOff size={32} />}
        </div>
        
        <h4 className="text-xl font-black text-heading">
          {user?.fcmToken ? 'Notifications Enabled' : 'Stay in the loop!'}
        </h4>
        
        <p className="text-body text-sm px-2">
          {user?.fcmToken 
            ? "You are currently receiving real-time alerts for your orders and delivery updates." 
            : "Get real-time push notifications about your order status, delivery tracking, and payment updates so you never miss a thing."}
        </p>

        <div className="w-full pt-4 flex gap-3">
          <Button variant="ghost" className="w-full" onClick={handleClose} disabled={isLoading}>
            {user?.fcmToken ? 'Close' : 'Not Now'}
          </Button>
          <Button 
            variant={user?.fcmToken ? "danger" : "primary"} 
            className="w-full" 
            onClick={handleToggleNotifications}
            loading={isLoading}
          >
            {user?.fcmToken ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationPrompt;
