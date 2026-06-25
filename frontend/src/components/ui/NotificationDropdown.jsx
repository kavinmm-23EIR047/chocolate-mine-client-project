import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, Package, Clock, ShoppingBag, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../sockets/socketManager';

const NotificationDropdown = ({ iconClass, buttonClass, showLabel }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const data = res.data.data || [];
      // Backend already formats notifications in notificationController.js,
      // but let's ensure we parse correctly in case of fallback or direct format.
      setNotifications(data.slice(0, 5)); // show only top 5 in dropdown
      
      // Fetch fresh count from unread-count endpoint
      const countRes = await api.get('/notifications/unread-count');
      setUnreadCount(countRes.data.count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user, isOpen]);

  useEffect(() => {
    if (!user) return;
    
    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (data) => {
        setUnreadCount(prev => prev + 1);
        setNotifications(prev => {
          const exists = prev.some(n => n._id === data._id);
          if (exists) return prev;
          return [
            {
              _id: data._id || Date.now().toString(),
              title: data.title,
              message: data.message,
              type: data.type,
              data: data.data || {},
              isRead: false,
              createdAt: data.createdAt || new Date().toISOString()
            },
            ...prev
          ].slice(0, 5);
        });
      };

      socket.on('new_notification', handleNewNotification);

      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    }
  }, [user]);

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
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    
    // Mark read if unread
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }

    // Redirect
    const url = notif.data?.url;
    if (url) {
      navigate(url);
    }
  };

  const getIcon = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('delivered') || t.includes('success')) return <CheckCircle size={16} className="text-green-500" />;
    if (t.includes('preparing') || t.includes('packed')) return <Package size={16} className="text-yellow-500" />;
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
        className={buttonClass || "relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center"}
      >
        <div className="relative flex items-center justify-center">
          <Bell size={24} className={iconClass || "text-heading"} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent rounded-full flex items-center justify-center text-[10px] font-black text-[#120806] leading-none z-10">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {showLabel && <span className="text-[11px] font-bold text-muted group-hover:text-primary uppercase tracking-wide whitespace-nowrap transition-colors">Alerts</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[80px] left-4 right-4 mx-auto w-auto max-w-[400px] sm:absolute sm:top-full sm:mt-2 sm:left-auto sm:right-0 sm:mx-0 sm:w-96 bg-card border border-border/50 rounded-2xl shadow-xl z-[999] overflow-hidden origin-top"
          >
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-black/5 dark:bg-white/5">
              <h3 className="font-black text-heading text-sm uppercase tracking-wider">Notifications</h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-primary font-black uppercase tracking-wider hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-background rounded-full border border-border/50 text-muted hover:text-heading hover:bg-border/30 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
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
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 rounded-xl flex gap-3 transition-colors cursor-pointer ${
                        notif.isRead 
                          ? 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5' 
                          : 'bg-primary/5 hover:bg-primary/10'
                      }`}
                    >
                      <div className="mt-1 shrink-0 bg-card rounded-full p-1.5 shadow-sm h-8 w-8 flex items-center justify-center border border-border/40">
                        {getIcon(notif.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs ${notif.isRead ? 'text-heading font-bold' : 'text-primary font-black'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[9px] text-muted/60 font-bold mt-1.5 uppercase tracking-wider">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border/50 text-center bg-black/5 dark:bg-white/5">
              <Link
                to="/account/notifications"
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline inline-block w-full"
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;