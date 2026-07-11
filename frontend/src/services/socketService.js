import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    if (!token) {
      console.error('No token provided for socket connection');
      return;
    }

    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api/v1', '');
    
    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.trigger('connect', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.trigger('disconnect', {});
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      this.trigger('error', error);
    });

    // Order Events
    this.socket.on('order_status_updated', (data) => {
      this.trigger('order_status_updated', data);
    });

    this.socket.on('my_order_updated', (data) => {
      this.trigger('my_order_updated', data);
    });

    this.socket.on('order_detail_updated', (data) => {
      this.trigger('order_detail_updated', data);
    });

    this.socket.on('orders_needs_refresh', () => {
      this.trigger('orders_needs_refresh', {});
    });

    this.socket.on('dashboard_needs_refresh', () => {
      this.trigger('dashboard_needs_refresh', {});
    });

    this.socket.on('assigned_order_updated', (data) => {
      this.trigger('assigned_order_updated', data);
    });

    // Notification Events
    this.socket.on('notification_acknowledged', (data) => {
      this.trigger('notification_acknowledged', data);
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.trigger('disconnect', {});
    }
  }

  // Reconnect socket
  reconnect(token) {
    this.disconnect();
    this.connect(token);
  }

  // Join a room
  joinRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join', room);
    }
  }

  // Leave a room
  leaveRoom(room) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave', room);
    }
  }

  // Join user room
  joinUserRoom(userId) {
    if (this.socket && this.isConnected && userId) {
      this.socket.emit('join_user_room', userId);
    }
  }

  // Join order room
  joinOrderRoom(orderId) {
    if (this.socket && this.isConnected && orderId) {
      this.socket.emit('join_order_room', orderId);
    }
  }

  // Join admin room
  joinAdminRoom() {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_admin_room');
    }
  }

  // Join staff room
  joinStaffRoom(staffId) {
    if (this.socket && this.isConnected && staffId) {
      this.socket.emit('join_staff_room', staffId);
    }
  }

  // Send heartbeat
  sendHeartbeat(userId, role) {
    if (this.socket && this.isConnected) {
      this.socket.emit('dashboard_heartbeat', { userId, role });
    }
  }

  // Acknowledge notification
  acknowledgeNotification(orderId, userId, notificationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('acknowledge_notification', { orderId, userId, notificationId });
    }
  }

  // Request refresh for user orders
  refreshUserOrders(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('refresh_user_orders', userId);
    }
  }

  // Request refresh for admin dashboard
  refreshAdminDashboard() {
    if (this.socket && this.isConnected) {
      this.socket.emit('refresh_admin_dashboard');
    }
  }

  // Request refresh for staff dashboard
  refreshStaffDashboard(staffId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('refresh_staff_dashboard', staffId);
    }
  }

  // Staff updates order status
  staffUpdateOrder(orderId, status, staffId, orderNumber) {
    if (this.socket && this.isConnected) {
      this.socket.emit('staff_update_order', { orderId, status, staffId, orderNumber });
    }
  }

  // Register event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Trigger event
  trigger(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event handler for ${event}:`, error);
        }
      });
    }
  }

  // Check connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;