import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { requestFirebaseNotificationPermission, auth, onAuthStateChanged, logoutGoogle } from '../firebase';

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

  // Initialize auth state - auto-login via Firebase & Bearer token / HttpOnly cookie
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');

      // Fast-path: If user is a guest (no token/stored session), skip network auth check
      if (!storedUser && !token) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        } catch (err) {
          console.error('🔐 Failed to parse stored user', err);
        }
      }

      // Verify session with server if token or stored user existed
      try {
        const response = await api.get('/auth/me');
        const userData = response.data.user;
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('user', JSON.stringify(userData));

        // Sync FCM token in background
        syncFcmToken();
      } catch (err) {
        // Quietly clear stale session data if token expired/invalid
        if (!auth?.currentUser) {
          setUser(null);
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Firebase onAuthStateChanged listener
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Get a standard backend session via Firebase Login route
            const response = await api.post('/auth/firebase-login', {
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              avatar: firebaseUser.photoURL
            });
            const { user: userData, token } = response.data;
            if (userData) {
              userData.isFirebase = true;
              setUser(userData);
              sessionStorage.setItem('user', JSON.stringify(userData));
              localStorage.setItem('user', JSON.stringify(userData));
            }
            if (token) {
              sessionStorage.setItem('token', token);
              localStorage.setItem('token', token);
            }
            
            // Sync FCM token in background
            syncFcmToken();
          } catch (err) {
            console.error('Backend Firebase Auth failed', err);
          } finally {
            setLoading(false);
          }
        } else {
          // Only clear if standard user is also not present
          const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
          if (storedUser) {
             try {
                const parsed = JSON.parse(storedUser);
                if (parsed.isFirebase) {
                    setUser(null);
                    sessionStorage.removeItem('user');
                    sessionStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
             } catch(e) {}
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const login = async ({ email, password }) => {
    console.log('🔐 Logging in:', email);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token } = response.data;
      
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('user', JSON.stringify(userData));
      
      if (token) {
        sessionStorage.setItem('token', token);
        localStorage.setItem('token', token);
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
      // Remove current browser FCM token from database first (while still authenticated)
      await disableNotifications();
    } catch (err) {
      console.error('Failed to disable FCM on logout:', err.message);
    }

    try {
      // Clear server cookie
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout API error:', err.message);
    }
    
    // Firebase logout
    try {
      await logoutGoogle();
    } catch (err) {
      console.error('Firebase Logout error:', err.message);
    }
    
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('auth_user');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
    
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