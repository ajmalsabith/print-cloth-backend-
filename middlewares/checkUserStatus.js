const User = require('../models/User');
const { verifyUserToken, verifyAdminToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');

const checkUserStatus = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = verifyUserToken(token);
    } catch (error) {
      try {
        decoded = verifyAdminToken(token);
      } catch (adminError) {
        return next();
      }
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user.status === 'banned') {
      return sendError(res, 'Your account has been banned. Please contact support.', 403, { banned: true });
    }

    next();
  } catch (error) {
    console.error('Check user status error:', error);
    return sendError(res, 'Server error while checking user status', 500);
  }
};

module.exports = checkUserStatus;