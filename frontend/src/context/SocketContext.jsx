import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setSocketId(null);
      }
      return;
    }

    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api/v1', '');
    
    // Initialize socket connection
    const socket = io(baseUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setIsConnected(true);
      setSocketId(socket.id);
      
      // Join user-specific room
      socket.emit('join_user_room', user._id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
      setSocketId(null);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      // Rejoin user room after reconnect
      socket.emit('join_user_room', user._id);
    });

    // Global event listeners
    socket.on('order_status_updated', (data) => {
      console.log('📦 Order status updated:', data);
      // You can show a toast notification for status updates
      if (data.status === 'delivered') {
        toast.success(`Order #${data.orderNumber} has been delivered! 🎉`);
      } else if (data.status === 'out_for_delivery') {
        toast.success(`Order #${data.orderNumber} is out for delivery! 🚚`);
      }
    });

    socket.on('my_order_updated', (data) => {
      console.log('📦 Your order has been updated:', data);
    });

    socket.on('dashboard_needs_refresh', () => {
      console.log('🔄 Dashboard refresh requested');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  // Helper functions
  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`Socket not connected, cannot emit ${event}`);
    }
  };

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  const joinRoom = (room) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join', room);
    }
  };

  const leaveRoom = (room) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave', room);
    }
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    socketId,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
