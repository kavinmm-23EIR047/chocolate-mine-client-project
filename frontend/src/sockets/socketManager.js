import { io } from 'socket.io-client';
import { syncCartStock } from '../redux/slices/cartSlice';
import { apiSlice } from '../services/api/apiSlice';

let socket;

export const initSocket = (dispatch) => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
  socket = io(socketUrl, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('📡 Global Socket Connected:', socket.id);
  });

  socket.on('stock_updated', (data) => {
    console.log('📡 Real-time Stock Sync:', data);
    
    // 1. Sync Cart items stock locally
    dispatch(syncCartStock(data));

    // 2. Invalidate RTK Query cache for the specific product
    dispatch(
      apiSlice.util.invalidateTags([{ type: 'Product', id: data.productId }])
    );
  });

  socket.on('disconnect', (reason) => {
    console.log('📡 Global Socket Disconnected:', reason);
  });

  // Reconnect automatically when page is restored from Back-Forward Cache (bfcache)
  if (typeof window !== 'undefined') {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted && socket && !socket.connected) {
        socket.connect();
      }
    });
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

export const joinUserRoom = (userId) => {
  if (socket) socket.emit('join_user', userId);
};

export const joinAdminRoom = () => {
  if (socket) socket.emit('join_admin');
};

export const joinStaffRoom = (staffId) => {
  if (socket) socket.emit('join_staff', staffId);
};
