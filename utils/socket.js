const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

let io;
const connectedUsers = new Map(); 

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_USER_SECRET);
      } catch (userError) {
        try {
          decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
        } catch (adminError) {
          return next(new Error('Authentication error: Invalid token'));
        }
      }

      socket.userId = decoded.id;
      socket.userRole = decoded.role || 'user';
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId} (${socket.userRole})`);
    
    connectedUsers.set(socket.userId, socket.id);

    socket.join(`user_${socket.userId}`);

    if (socket.userRole === 'admin') {
      socket.join('admin_room');
    }

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
      connectedUsers.delete(socket.userId);
    });

    socket.on('check_user_status', (callback) => {
      callback({ status: 'checked' });
    });
  });

  logger.info('Socket.IO initialized successfully');
  return io;
};

const notifyUserBanned = (userId, userName, bannedBy) => {
  if (!io) return;

  const notification = {
    type: 'USER_BANNED',
    userId,
    userName,
    bannedBy,
    timestamp: new Date().toISOString(),
    message: 'Your account has been banned. You will be logged out.'
  };

  io.to(`user_${userId}`).emit('user_banned', notification);
  
  io.to('admin_room').emit('user_status_changed', {
    type: 'USER_BANNED',
    userId,
    userName,
    status: 'banned',
    updatedBy: bannedBy,
    timestamp: new Date().toISOString()
  });

  logger.info(`Ban notification sent to user ${userId} and all admins`);
};

// Currently its not using (We force logout on ban)
const notifyUserUnbanned = (userId, userName, unbannedBy) => {
  if (!io) return;

  const notification = {
    type: 'USER_UNBANNED',
    userId,
    userName,
    unbannedBy,
    timestamp: new Date().toISOString(),
    message: 'Your account has been unbanned. You can now use the application normally.'
  };

  io.to(`user_${userId}`).emit('user_unbanned', notification);
  
  io.to('admin_room').emit('user_status_changed', {
    type: 'USER_UNBANNED',
    userId,
    userName,
    status: 'active',
    updatedBy: unbannedBy,
    timestamp: new Date().toISOString()
  });

  logger.info(`Unban notification sent to user ${userId} and all admins`);
};

const notifyForceLogout = (userId, userName, loggedOutBy) => {
  if (!io) return;

  const notification = {
    type: 'FORCE_LOGOUT',
    userId,
    userName,
    loggedOutBy,
    timestamp: new Date().toISOString(),
    message: 'Session ended. You have been logged out.'
  };

  io.to(`user_${userId}`).emit('force_logout', notification);
  
  io.to('admin_room').emit('user_force_logout', {
    type: 'FORCE_LOGOUT',
    userId,
    userName,
    loggedOutBy,
    timestamp: new Date().toISOString()
  });

  logger.info(`Force logout notification sent to user ${userId} and all admins`);
};

const notifyAdmins = (event, data) => {
  if (!io) return;
  io.to('admin_room').emit(event, data);
};

const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

const getOnlineUsersCount = () => {
  return connectedUsers.size;
};

module.exports = {
  initializeSocket,
  notifyUserBanned,
  notifyUserUnbanned,
  notifyForceLogout,
  notifyAdmins,
  isUserOnline,
  getOnlineUsersCount
};