const socketService = require('../services/socketService');
const User = require('../models/User');
const Notification = require('../models/Notification');

module.exports = (io) => {
  socketService.init(io);
  
  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);
    
    // Heartbeat to track if staff/admin is online
    socket.on('dashboard_heartbeat', async (data) => {
      const { userId, role } = data;
      if (userId) {
        await User.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
        console.log(`❤️ Heartbeat from ${role || 'user'}: ${userId}`);
      }
    });

    // Join user-specific room for order updates
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        socket.join(`user:${userId}`);
        console.log(`👤 User ${userId} joined their room`);
      }
    });
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        socket.join(`user:${userId}`);
        console.log(`👤 User ${userId} joined user room (alias)`);
      }
    });

    // Join staff-specific room
    socket.on('join_staff_room', (staffId) => {
      if (staffId) {
        socket.join(`staff_${staffId}`);
        console.log(`👨‍🍳 Staff ${staffId} joined staff room`);
      }
    });
    socket.on('join_staff', (staffId) => {
      if (staffId) {
        socket.join(`staff_${staffId}`);
        console.log(`👨‍🍳 Staff ${staffId} joined staff room (alias)`);
      }
    });

    // Join admin room
    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log(`👑 Admin joined admin room`);
    });
    socket.on('join_admin', () => {
      socket.join('admin_room');
      console.log(`👑 Admin joined admin room (alias)`);
    });

    // Join specific order room for real-time tracking
    socket.on('join_order_room', (orderId) => {
      if (orderId) {
        socket.join(`order_${orderId}`);
        console.log(`📦 Joined order room: ${orderId}`);
      }
    });

    // Leave order room
    socket.on('leave_order_room', (orderId) => {
      if (orderId) {
        socket.leave(`order_${orderId}`);
        console.log(`🚪 Left order room: ${orderId}`);
      }
    });

    // Acknowledge notification to stop WhatsApp fallback
    socket.on('acknowledge_notification', async (data) => {
      const { orderId, userId, notificationId } = data;
      if (orderId && userId) {
        try {
          await Notification.create({
            orderId,
            userId,
            recipientRole: 'admin',
            acknowledged: true,
            channel: 'WEB',
            type: 'ACKNOWLEDGEMENT'
          });
          
          // Also emit to the specific order room
          io.to(`order_${orderId}`).emit('notification_acknowledged', {
            orderId,
            acknowledgedAt: new Date()
          });
        } catch (err) {
          console.error('Failed to acknowledge notification:', err);
        }
      }
    });

    // Staff updates order status
    socket.on('staff_update_order', async (data) => {
      const { orderId, status, staffId, orderNumber } = data;
      
      // Broadcast to all relevant rooms
      io.to(`order_${orderId}`).emit('order_status_changed', {
        orderId,
        status,
        orderNumber,
        updatedAt: new Date(),
        updatedBy: staffId
      });
      
      // Broadcast to admin room
      io.to('admin_room').emit('order_status_changed', {
        orderId,
        status,
        orderNumber,
        updatedAt: new Date()
      });
      
      console.log(`📢 Order ${orderNumber} status changed to ${status}`);
    });

    // Request order refresh for specific user
    socket.on('refresh_user_orders', (userId) => {
      if (userId) {
        io.to(`user_${userId}`).emit('orders_needs_refresh');
        console.log(`🔄 Requested orders refresh for user ${userId}`);
      }
    });

    // Request admin dashboard refresh
    socket.on('refresh_admin_dashboard', () => {
      io.to('admin_room').emit('dashboard_needs_refresh');
      console.log(`🔄 Requested admin dashboard refresh`);
    });

    // Request staff dashboard refresh
    socket.on('refresh_staff_dashboard', (staffId) => {
      if (staffId) {
        io.to(`staff_${staffId}`).emit('dashboard_needs_refresh');
        console.log(`🔄 Requested staff dashboard refresh for ${staffId}`);
      } else {
        io.to('admin_room').emit('dashboard_needs_refresh');
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
  
  // Export function to emit order updates from controllers
  return {
    emitOrderUpdate: (order) => {
      if (!order) return;
      
      // Emit to order room
      io.to(`order_${order._id}`).emit('order_detail_updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        updatedAt: order.updatedAt
      });
      
      // Emit to user room
      if (order.userId) {
        io.to(`user_${order.userId}`).emit('my_order_updated', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.orderStatus,
          updatedAt: order.updatedAt
        });
      }
      
      // Emit to admin room
      io.to('admin_room').emit('order_status_updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        updatedAt: order.updatedAt
      });
      
      // Emit to assigned staff room
      if (order.assignedStaff) {
        io.to(`staff_${order.assignedStaff}`).emit('assigned_order_updated', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.orderStatus,
          updatedAt: order.updatedAt
        });
      }
      
      console.log(`📡 Socket emission: Order ${order.orderNumber} status = ${order.orderStatus}`);
    }
  };
};