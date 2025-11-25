const User = require('../models/User');
const { generateAdminToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const { notifyUserBanned, notifyUserUnbanned } = require('../utils/socket');

class AdminService {
  static async login(credentials) {
    try {
      const { email, password } = credentials;

      const admin = await User.findByEmail(email);
      if (!admin || admin.role !== 'admin') {
        throw new Error('Invalid admin credentials');
      }

      if (admin.status === 'banned') {
        throw new Error('Admin account has been banned');
      }

      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid admin credentials');
      }

      admin.lastLogin = new Date();
      await admin.save();

      const token = generateAdminToken({
        id: admin._id,
        email: admin.email,
        role: admin.role
      });

      logger.info(`Admin logged in: ${email}`);

      return {
        admin: admin.getPublicProfile(),
        token
      };
    } catch (error) {
      logger.error('Admin login error:', error);
      throw error;
    }
  }

  static async getUsers(params) {
    try {
      const { page, limit, skip, search, status, role, sortBy, sortOrder } = params;

      const filter = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) filter.status = status;
      if (role) filter.role = role;

      const users = await User.find(filter)
        .select('-password')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

      const totalUsers = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalUsers / limit);

      return {
        users: users.map(user => user.getPublicProfile()),
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      };
    } catch (error) {
      logger.error('Get users error:', error);
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
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  static async updateUser(userId, updateData, adminUser) {
    try {
      if (userId === adminUser._id.toString()) {
        delete updateData.role;
        delete updateData.status;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      logger.info(`User updated: ${user.email} by ${adminUser.email}`);

      return user.getPublicProfile();
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  }

  static async deleteUser(userId, adminUser) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new Error('User not found');
      }

      logger.info(`User deleted: ${user.email} by ${adminUser.email}`);

      return { deletedUserId: userId };
    } catch (error) {
      logger.error('Delete user error:', error);
      throw error;
    }
  }

  static async banUser(userId, reason, adminUser) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          status: 'banned',
          banReason: reason,
          bannedAt: new Date(),
          bannedBy: adminUser._id
        },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      logger.info(`User banned: ${user.email} by ${adminUser.email}, reason: ${reason}`);
      
      notifyUserBanned(user._id.toString(), user.name, adminUser.name, reason);

      return user.getPublicProfile();
    } catch (error) {
      logger.error('Ban user error:', error);
      throw error;
    }
  }

  static async unbanUser(userId, adminUser) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          status: 'active',
          banReason: null,
          bannedAt: null,
          bannedBy: null
        },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      logger.info(`User unbanned: ${user.email} by ${adminUser.email}`);
      
      notifyUserUnbanned(user._id.toString(), user.name, adminUser.name);

      return user.getPublicProfile();
    } catch (error) {
      logger.error('Unban user error:', error);
      throw error;
    }
  }

  static async getDashboardStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        bannedUsers,
        totalAdmins
      ] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ role: 'user', status: 'active' }),
        User.countDocuments({ role: 'user', status: 'banned' }),
        User.countDocuments({ role: 'admin' })
      ]);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentUsers = await User.countDocuments({
        role: 'user',
        createdAt: { $gte: sevenDaysAgo }
      });

      return {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalAdmins,
        recentUsers
      };
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      throw error;
    }
  }
}

module.exports = AdminService;