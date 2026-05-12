import { io } from 'socket.io-client';
import { syncCartStock } from '../redux/slices/cartSlice';
import { apiSlice } from '../services/api/apiSlice';

let socket;

export const initSocket = (dispatch) => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  socket = io(socketUrl, {
    transports: ['websocket'],
    reconnection: true,
  });

  socket.on('connect', () => {
    console.log('📡 Global Socket Connected:', socket.id);
  });

  socket.on('stock_updated', (data) => {
    console.log('📡 Real-time Stock Sync:', data);
    
    // 1. Sync Cart items stock locally
    dispatch(syncCartStock(data));

    // 2. Invalidate RTK Query cache for the specific product
    // This triggers a re-fetch or updates the cache if using cache manipulation
    dispatch(
      apiSlice.util.invalidateTags([{ type: 'Product', id: data.productId }])
    );
  });

  socket.on('disconnect', () => {
    console.log('📡 Global Socket Disconnected');
  });

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
