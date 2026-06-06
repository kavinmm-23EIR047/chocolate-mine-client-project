import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Home, Building, Navigation, Bell, BellOff } from 'lucide-react';
import { requestFirebaseNotificationPermission } from '../../firebase';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const ProfileDetails = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error("Name is required");

    try {
      setLoading(true);
      const res = await api.put('/users/profile', formData);
      if (res.data?.data) {
        updateUser(res.data.data);
        toast.success("Profile updated!");
        setIsEditing(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      setNotifLoading(true);
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
    } catch (err) {
      toast.error("Failed to update notification preferences.");
      console.error(err);
    } finally {
      setNotifLoading(false);
    }
  };

  const defaultAddress = user?.addresses?.find(addr => addr.isDefault) || user?.addresses?.[0];

  // Helper to format member since date
  const formatMemberSince = (date) => {
    if (!date) return 'Recently Joined';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-heading tracking-tight break-words">Profile Details</h1>
        <p className="text-xs sm:text-sm text-muted font-bold mt-1 break-words">Manage your personal information</p>
      </div>

      <div className="card-premium p-5 sm:p-6 md:p-8 border border-border/50 bg-card shadow-card rounded-2xl sm:rounded-3xl">
        {/* Basic Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Full Name */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-input border-2 border-secondary/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold text-heading focus:border-secondary outline-none transition-all"
                placeholder="Enter your full name"
                disabled={loading}
              />
            ) : (
              <div className="bg-surface border border-border/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold text-heading break-words whitespace-normal">
                {formData.name || user?.name || 'Not provided'}
              </div>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Email Address</label>
            <div className="bg-card-soft border border-border/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold text-muted cursor-not-allowed break-all whitespace-normal">
              {user?.email}
            </div>
            {isEditing && (
              <p className="text-[10px] text-muted ml-2 font-bold">Email cannot be changed.</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-input border-2 border-secondary/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold text-heading focus:border-secondary outline-none transition-all"
                placeholder="Enter your phone number"
                disabled={loading}
              />
            ) : (
              <div className="bg-surface border border-border/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold text-heading break-words">
                {formData.phone || user?.phone || 'Not provided'}
              </div>
            )}
          </div>

          {/* Member Since */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2 block">Member Since</label>
            <div className="bg-surface border border-border/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold text-heading break-words">
              {formatMemberSince(user?.createdAt)}
            </div>
          </div>
        </div>

        {/* Address Section - Only if address exists */}
        {defaultAddress && (
          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-border/50">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <MapPin size={18} className="text-primary shrink-0" />
              <h3 className="text-sm sm:text-base font-black text-heading uppercase tracking-wider">Primary Delivery Address</h3>
              {defaultAddress.isDefault && (
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ml-2">Default</span>
              )}
            </div>
            <div className="bg-surface/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Recipient</p>
                  <p className="font-bold text-heading break-words">{defaultAddress.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Phone</p>
                  <p className="font-bold text-heading break-words">{defaultAddress.phone}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Complete Address</p>
                  <p className="font-bold text-heading leading-relaxed break-words whitespace-normal">
                    {defaultAddress.houseNo}, {defaultAddress.street}<br />
                    {defaultAddress.city} - {defaultAddress.pincode}
                  </p>
                </div>
                {defaultAddress.type && (
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Address Type</p>
                    <div className="inline-flex items-center gap-1.5 bg-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-border/50">
                      {defaultAddress.type === 'Home' ? <Home size={12} /> : defaultAddress.type === 'Work' ? <Building size={12} /> : <Navigation size={12} />}
                      {defaultAddress.type}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Preference */}
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-border/50">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <Bell size={18} className="text-primary shrink-0" />
            <h3 className="text-sm sm:text-base font-black text-heading uppercase tracking-wider">Notification Preferences</h3>
          </div>
          <div className="bg-surface/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-heading">Push Notifications</p>
              <p className="text-xs text-muted font-bold mt-1">Get real-time alerts for your orders and delivery updates.</p>
            </div>
            <Button
              variant={user?.fcmToken ? "outline" : "primary"}
              onClick={handleToggleNotifications}
              loading={notifLoading}
              className="w-full sm:w-auto shrink-0"
            >
              {user?.fcmToken ? (
                <>
                  <BellOff size={14} className="mr-2" />
                  DISABLE NOTIFICATIONS
                </>
              ) : (
                <>
                  <Bell size={14} className="mr-2" />
                  ENABLE NOTIFICATIONS
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border/50">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="bg-button-alt-bg text-button-alt-text w-full sm:w-auto order-2 sm:order-1"
                disabled={loading}
              >
                CANCEL
              </Button>
              <Button
                onClick={handleSave}
                loading={loading}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                SAVE CHANGES
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditing(true)} className="shadow-sm w-full sm:w-auto">
              <Edit3 size={14} className="mr-2" />
              EDIT PROFILE
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileDetails;