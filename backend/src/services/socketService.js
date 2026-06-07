let io;

const socketService = {
  init: (serverIo) => {
    io = serverIo;
    io.on('connection', (socket) => {
      socket.on('join', (room) => socket.join(room));
      socket.on('disconnect', () => {});
    });
  },

  emitToUser: (userId, event, data) => {
    if (io) io.to(`user:${userId}`).emit(event, data);
  },

  emitToStaff: (event, data) => {
    if (io) io.to('staff_room').emit(event, data);
  },

  emitToAdmin: (event, data) => {
    if (io) io.to('admin_room').emit(event, data);
  },

  emitToAll: (event, data) => {
    if (io) io.emit(event, data);
  },
};

module.exports = socketService;
