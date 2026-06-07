import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { requestFirebaseNotificationPermission } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Detect device name for FCM token registration
  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'Android Mobile';
    if (/iPad|iPhone|iPod/.test(ua)) return 'iOS Device';
    if (/Windows/.test(ua)) return 'Windows Desktop';
    if (/Mac/.test(ua)) return 'Mac Desktop';
    if (/Linux/.test(ua)) return 'Linux Desktop';
    return 'Web Browser';
  };

  // Register FCM token with backend
  const syncFcmToken = async () => {
    try {
      const token = await requestFirebaseNotificationPermission();
      if (token) {
        const deviceName = getDeviceName();
        await api.put('/users/fcm-token', {
          fcmToken: token,
          deviceName
        });
        console.log('🔔 FCM token synced successfully');
        
        // Update user fcmTokens array locally
        setUser(prev => {
          if (!prev) return prev;
          const updatedTokens = prev.fcmTokens ? [...prev.fcmTokens] : [];
          const idx = updatedTokens.findIndex(t => t.token === token);
          if (idx >= 0) {
            updatedTokens[idx].deviceName = deviceName;
            updatedTokens[idx].createdAt = new Date();
          } else {
            updatedTokens.push({ token, deviceName, createdAt: new Date() });
          }
          const updatedUser = { ...prev, fcmTokens: updatedTokens };
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          return updatedUser;
        });
      }
    } catch (err) {
      console.error('FCM sync failed:', err.message);
    }
  };

  // Disable/remove FCM token
  const disableNotifications = async () => {
    try {
      let token = null;
      try {
        token = await requestFirebaseNotificationPermission();
      } catch (e) {}

      if (token) {
        await api.put('/users/fcm-token', { fcmToken: token, remove: true });
        setUser(prev => {
          if (!prev) return prev;
          const updatedTokens = (prev.fcmTokens || []).filter(t => t.token !== token);
          const updatedUser = { ...prev, fcmTokens: updatedTokens };
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          return updatedUser;
        });
      } else {
        // Fallback: clear all if no token is accessible
        await api.put('/users/fcm-token', { fcmToken: null });
        setUser(prev => {
          if (!prev) return prev;
          const updatedUser = { ...prev, fcmTokens: [] };
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          return updatedUser;
        });
      }
      console.log('🔔 FCM notifications disabled successfully');
    } catch (err) {
      console.error('Disable notifications failed:', err.message);
      throw err;
    }
  };

  // Initialize auth state - auto-login via HttpOnly cookie
  useEffect(() => {
    const initializeAuth = async () => {
      // First, check sessionStorage for fast restore
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        } catch (err) {
          console.error('🔐 Failed to parse stored user', err);
        }
      }

      // Verify session with server (cookie sent automatically)
      try {
        console.log('🔐 Auto-login: verifying session...');
        const response = await api.get('/auth/me');
        const userData = response.data.user;
        console.log('🔐 Auto-login: session valid for', userData.email);
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));

        // Sync FCM token in background
        syncFcmToken();
      } catch (err) {
        const status = err.response?.status || err.status;
        console.log('🔐 Auto-login: no valid session', status);
        
        // Clear stale session data
        setUser(null);
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async ({ email, password }) => {
    console.log('🔐 Logging in:', email);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token } = response.data;
      
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
      // Keep token in sessionStorage for backward compat (Bearer header)
      if (token) {
        sessionStorage.setItem('token', token);
      }
      
      // Sync FCM token after login
      syncFcmToken();

      return response.data;
    } catch (err) {
      console.error('🔐 Login failed:', err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      // Clear server cookie
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout API error:', err.message);
    }
    
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('auth_user');
    
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated, 
      login, 
      logout, 
      updateUser,
      syncFcmToken,
      disableNotifications
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};