import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, Package, Clock, ShoppingBag, X } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const NotificationDropdown = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        const data = res.data.data || [];
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.opened).length);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
  }, [user, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, opened: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  const getIcon = (type) => {
    const t = type.toLowerCase();
    if (t.includes('delivered') || t.includes('success')) return <CheckCircle size={16} className="text-green-500" />;
    if (t.includes('packed')) return <Package size={16} className="text-yellow-500" />;
    if (t.includes('delivery')) return <ShoppingBag size={16} className="text-blue-500" />;
    return <Clock size={16} className="text-primary" />;
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <Bell size={20} className="text-heading" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 w-[calc(100vw-2rem)] sm:w-96 bg-card border border-border/50 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-black/5 dark:bg-white/5">
              <h3 className="font-black text-heading text-sm uppercase tracking-wider">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted">
                  <Bell size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-3 rounded-xl flex gap-3 transition-colors ${notif.opened ? 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5' : 'bg-primary/5 hover:bg-primary/10'}`}
                    >
                      <div className="mt-1 shrink-0 bg-card rounded-full p-1.5 shadow-sm">
                        {getIcon(notif.type)}
                      </div>
                      <div>
                        <p className={`text-sm ${notif.opened ? 'text-heading font-bold' : 'text-primary font-black'}`}>
                          {notif.type}
                        </p>
                        <p className="text-xs text-muted mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-muted/60 font-bold mt-2 uppercase tracking-wider">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;