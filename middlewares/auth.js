const { verifyUserToken, verifyAdminToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const User = require('../models/User');
const logger = require('../utils/logger');


const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access token required', 401);
    }

    const token = authHeader.substring(7);

    const decoded = verifyUserToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    if (user.status === 'banned') {
      return sendError(res, 'Account has been banned', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('User authentication error:', error);
    return sendError(res, 'Invalid or expired token', 401);
  }
};

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Admin auth: Missing or invalid authorization header', { authHeader });
      return sendError(res, 'Access token required', 401);
    }

    const token = authHeader.substring(7); 
    
    if (!token) {
      logger.warn('Admin auth: Empty token after Bearer prefix');
      return sendError(res, 'Access token required', 401);
    }

    const decoded = verifyAdminToken(token);
    logger.info('Admin token verified successfully', { adminId: decoded.id });

    const admin = await User.findById(decoded.id);
    if (!admin || admin.role !== 'admin') {
      logger.warn('Admin auth: User not found or not admin', { 
        userId: decoded.id, 
        userExists: !!admin, 
        userRole: admin?.role 
      });
      return sendError(res, 'Admin not found', 403);
    }

    if (admin.status === 'banned') {
      logger.warn('Admin auth: Admin account is banned', { adminId: admin._id });
      return sendError(res, 'Admin account has been banned', 403);
    }

    req.admin = admin;
    next();
  } catch (error) {
    logger.error('Admin authentication error:', error);
    return sendError(res, 'Invalid or expired admin token', 401);
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return sendError(res, 'Admin privileges required', 403);
  }
  next();
};

module.exports = {
  authenticateUser,
  authenticateAdmin,
  requireAdmin
};