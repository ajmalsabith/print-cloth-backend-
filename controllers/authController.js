const BaseController = require('./BaseController');
const { AuthService } = require('../services');
const { registerValidation, loginValidation, profileUpdateValidation, passwordChangeValidation } = require('../utils/validation');

class AuthController extends BaseController {
  static register = BaseController.asyncHandler(async (req, res) => {
    const validatedData = BaseController.validateRequest(registerValidation, req.body);
    const result = await AuthService.register(validatedData);
    BaseController.logAction('USER_REGISTER', result.user);
    BaseController.sendSuccess(res, 'User registered successfully. Welcome!', result, 201);
  });

  static login = BaseController.asyncHandler(async (req, res) => {
    const validatedData = BaseController.validateRequest(loginValidation, req.body);
    const result = await AuthService.login(validatedData);
    BaseController.logAction('USER_LOGIN', result.user);
    BaseController.sendSuccess(res, 'Login successful', result);
  });

  static getProfile = BaseController.asyncHandler(async (req, res) => {
    const user = BaseController.sanitizeUser(req.user);
    BaseController.sendSuccess(res, 'Profile retrieved successfully', { user });
  });

  static updateProfile = BaseController.asyncHandler(async (req, res) => {
    const validatedData = BaseController.validateRequest(profileUpdateValidation, req.body);
    const user = await AuthService.updateProfile(req.user._id, validatedData);
    BaseController.logAction('PROFILE_UPDATE', user);
    BaseController.sendSuccess(res, 'Profile updated successfully', { user });
  });

  static changePassword = BaseController.asyncHandler(async (req, res) => {
    const validatedData = BaseController.validateRequest(passwordChangeValidation, req.body);
    await AuthService.changePassword(req.user._id, validatedData);
    BaseController.logAction('PASSWORD_CHANGE', req.user);
    BaseController.sendSuccess(res, 'Password changed successfully');
  });

  static logout = BaseController.asyncHandler(async (req, res) => {
    BaseController.logAction('USER_LOGOUT', req.user);
    BaseController.sendSuccess(res, 'Logged out successfully');
  });
}

module.exports = AuthController;