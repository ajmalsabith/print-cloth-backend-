const { sendSuccess, sendError, sendValidationError } = require('../utils/response');
const logger = require('../utils/logger');

class BaseController {
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static validateRequest(schema, data) {
    const { error, value } = schema.validate(data, { abortEarly: false });
    
    if (error) {
      throw {
        name: 'ValidationError',
        details: error.details
      };
    }
    
    return value;
  }

  static handleValidationError(res, error) {
    return sendValidationError(res, { error });
  }

  static sendSuccess(res, message, data = null, statusCode = 200) {
    return sendSuccess(res, message, data, statusCode);
  }
  static sendError(res, message, statusCode = 500, details = null) {
    return sendError(res, message, statusCode, details);
  }

  static logAction(action, user = null, details = {}) {
    const logData = {
      action,
      timestamp: new Date().toISOString(),
      ...details
    };

    if (user) {
      logData.user = {
        id: user._id || user.id,
        email: user.email,
        role: user.role
      };
    }

    logger.info(`Controller Action: ${action}`, logData);
  }



  static sanitizeUser(user) {
    if (!user) return null;
    
    const sanitized = user.toObject ? user.toObject() : user;
    delete sanitized.password;
    delete sanitized.__v;
    
    return sanitized;
  }
}

module.exports = BaseController;