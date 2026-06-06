import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { requestFirebaseNotificationPermission } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user');

      console.log('🔐 AuthContext: Initializing...', { hasToken: !!token, hasStoredUser: !!storedUser });

      if (!token) {
        console.log('🔐 AuthContext: No token found, user is guest');
        setLoading(false);
        return;
      }

      // If we have a user in storage, use it immediately for better UX
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          console.log('🔐 AuthContext: Restoring user from storage', parsed.email);
          setUser(parsed);
        } catch (err) {
          console.error('🔐 AuthContext: Failed to parse stored user', err);
        }
      }

      // Always verify token and get fresh user data from server
      try {
        console.log('🔐 AuthContext: Verifying token with server...');
        const response = await api.get('/auth/me');
        const userData = response.data.user;
        console.log('🔐 AuthContext: Token verified, user:', userData.email);
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));

        // Sync FCM token
        requestFirebaseNotificationPermission().then(token => {
          if (token) {
            api.put('/users/fcm-token', { fcmToken: token }).catch(err => console.error("FCM sync failed", err));
          }
        });
      } catch (err) {
        const status = err.response?.status || err.status;
        console.error('🔐 AuthContext: Verification failed', { status, message: err.message });
        
        // Only clear if it's a 401/403 error
        if (status === 401 || status === 403) {
          console.log('🔐 AuthContext: Clearing session due to auth error');
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async ({ email, password }) => {
    console.log('🔐 AuthContext: Attempting manual login for:', email);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token } = response.data;
      
      console.log('🔐 AuthContext: Manual login successful!', userData.email);
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('token', token);
      
      // Sync FCM token
      requestFirebaseNotificationPermission().then(fcmToken => {
        if (fcmToken) {
          api.put('/users/fcm-token', { fcmToken }).catch(err => console.error("FCM sync failed", err));
        }
      });

      return response.data;
    } catch (err) {
      console.error('🔐 AuthContext: Manual login failed', err.response?.data?.message || err.message);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    // Clear any other auth related items
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
      updateUser 
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