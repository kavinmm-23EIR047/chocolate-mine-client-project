import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, Package, Clock, ShoppingBag, Trash2, Tag, Gift, User, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      toast.error('Failed to update notifications');
    }
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read if unread
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // Redirect to target URL if available
    const url = notif.data?.url;
    if (url) {
      navigate(url);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // prevent triggering notification click
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('delivered') || t.includes('success')) return <CheckCircle size={16} className="text-green-500" />;
    if (t.includes('preparing') || t.includes('packed')) return <Package size={16} className="text-yellow-500" />;
    if (t.includes('delivery')) return <ShoppingBag size={16} className="text-blue-500" />;
    if (t.includes('coupon')) return <Tag size={16} className="text-purple-500" />;
    if (t.includes('offer')) return <Gift size={16} className="text-pink-500" />;
    if (t.includes('user') || t.includes('registration')) return <User size={16} className="text-teal-500" />;
    if (t.includes('contact') || t.includes('request')) return <MessageSquare size={16} className="text-indigo-500" />;
    return <Clock size={16} className="text-primary" />;
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black text-muted uppercase tracking-widest">Loading your alerts...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-heading uppercase tracking-tighter">Notification History</h2>
          <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">Real-time alerts and activity logs</p>
        </div>
        
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 border border-border/60 hover:bg-secondary/5 text-heading font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
            >
              Mark all read
            </button>
          )}
          <span className="bg-primary text-button-text px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-premium">
            {notifications.length} Total
          </span>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="py-20 text-center space-y-6 max-w-lg mx-auto">
          <div className="w-28 h-28 bg-primary/5 rounded-[2.5rem] flex items-center justify-center text-primary mx-auto mb-10 shadow-sm border border-primary/10">
            <Bell size={48} className="opacity-40" />
          </div>
          <h2 className="text-3xl font-black text-heading uppercase tracking-tighter">All caught up!</h2>
          <p className="text-[11px] font-black text-muted uppercase tracking-[0.2em] leading-loose">
            You don't have any notifications right now.<br /> We'll let you know when something exciting happens!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.map((notif) => (
              <motion.div
                key={notif._id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 sm:p-5 rounded-2xl flex gap-4 transition-all border cursor-pointer group hover:scale-[1.01] hover:shadow-md ${
                  notif.isRead
                    ? 'bg-card border-border/50 hover:border-primary/20'
                    : 'bg-primary/5 border-primary/20 hover:border-primary/40'
                }`}
              >
                <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                  notif.isRead ? 'bg-background border border-border/60 text-muted' : 'bg-primary/10 text-primary'
                }`}>
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className={`text-sm font-black text-heading leading-tight truncate ${!notif.isRead && 'text-primary'}`}>
                      {notif.title}
                    </h4>
                    
                    <button
                      onClick={(e) => handleDelete(e, notif._id)}
                      className="p-1.5 text-muted hover:text-error rounded-lg hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <p className="text-xs text-muted mt-1 leading-relaxed whitespace-pre-line">
                    {notif.message}
                  </p>
                  
                  <p className="text-[9px] text-muted/60 font-black mt-3 uppercase tracking-wider">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Notifications;
