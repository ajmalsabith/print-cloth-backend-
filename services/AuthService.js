const User = require('../models/User');
const { generateUserToken } = require('../utils/jwt');
const logger = require('../utils/logger');


class AuthService {
  static async register(userData) {
    try {
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const user = new User(userData);
      await user.save();

      const token = generateUserToken({
        id: user._id,
        email: user.email,
        role: user.role
      });

      logger.info(`New user registered: ${userData.email}`);

      return {
        user: user.getPublicProfile(),
        token
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  static async login(credentials) {
    try {
      const { email, password } = credentials;

      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (user.status === 'banned') {
        throw new Error('Your account has been banned. Please contact administrator.');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateUserToken({
        id: user._id,
        email: user.email,
        role: user.role
      });

      logger.info(`User logged in: ${email}`);

      return {
        user: user.getPublicProfile(),
        token
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  static async updateProfile(userId, updateData) {
    try {
      delete updateData.password;
      delete updateData.role;
      delete updateData.status;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      logger.info(`Profile updated: ${user.email}`);

      return user.getPublicProfile();
    } catch (error) {
      logger.error('Profile update error:', error);
      throw error;
    }
  }

  static async changePassword(userId, passwordData) {
    try {
      const { currentPassword, newPassword } = passwordData;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      return true;
    } catch (error) {
      logger.error('Password change error:', error);
      throw error;
    }
  }

  static async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user.getPublicProfile();
    } catch (error) {
      logger.error('Get user error:', error);
      throw error;
    }
  }

  static async validateUser(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.status === 'banned') {
        throw new Error('Account has been banned');
      }

      return user;
    } catch (error) {
      logger.error('User validation error:', error);
      throw error;
    }
  }
}

module.exports = AuthService;