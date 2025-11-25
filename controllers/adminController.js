const User = require('../models/User');
const { generateAdminToken } = require('../utils/jwt');
const { sendSuccess, sendError, sendValidationError } = require('../utils/response');
const { adminLoginValidation, statusUpdateValidation } = require('../utils/validation');
const logger = require('../utils/logger');
const { notifyUserBanned, notifyUserUnbanned } = require('../utils/socket');

const adminLogin = async (req, res) => {
  try {
    const { error, value } = adminLoginValidation.validate(req.body);
    if (error) {
      return sendValidationError(res, { error });
    }

    const { email, password } = value;

    const admin = await User.findByEmail(email);
    if (!admin || admin.role !== 'admin') {
      return sendError(res, 'Invalid admin credentials', 401);
    }

    if (admin.status === 'banned') {
      logger.warn(`Banned admin attempted login: ${email}`);
      return sendError(res, 'Admin account has been banned', 403);
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid admin credentials', 401);
    }

    const token = generateAdminToken({
      id: admin._id,
      email: admin.email,
      role: admin.role
    });

    logger.info(`Admin logged in: ${email}`);

    sendSuccess(res, 'Admin login successful', {
      token,
      admin: admin.getPublicProfile()
    });

  } catch (error) {
    logger.error('Admin login error:', error);
    sendError(res, 'Failed to login as admin', 500);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    logger.info(`Admin ${req.admin.email} fetched users list (page: ${page})`);

    sendSuccess(res, 'Users retrieved successfully', {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    sendError(res, 'Failed to retrieve users', 500);
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const { error, value } = statusUpdateValidation.validate(req.body);
    if (error) {
      return sendValidationError(res, { error });
    }

    const { status } = value;

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user._id.toString() === req.admin._id.toString()) {
      return sendError(res, 'Cannot change your own status', 400);
    }

    if (user.role === 'admin' && status === 'banned') {
      return sendError(res, 'Cannot ban other administrators', 400);
    }

    user.status = status;
    await user.save();

    const action = status === 'banned' ? 'banned' : 'unbanned';
    logger.info(`Admin ${req.admin.email} ${action} user: ${user.email}`);

    if (status === 'banned') {
      notifyUserBanned(user._id.toString(), user.name, req.admin.name);
    } else {
      notifyUserUnbanned(user._id.toString(), user.name, req.admin.name);
    }

    sendSuccess(res, `User ${action} successfully`, {
      user: user.getPublicProfile()
    });

  } catch (error) {
    logger.error('Update user status error:', error);
    sendError(res, 'Failed to update user status', 500);
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', status: 'active' });
    const bannedUsers = await User.countDocuments({ role: 'user', status: 'banned' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: sevenDaysAgo }
    });

    sendSuccess(res, 'Dashboard stats retrieved successfully', {
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalAdmins,
        recentUsers
      }
    });

  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    sendError(res, 'Failed to retrieve dashboard stats', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, 'User retrieved successfully', {
      user: user.getPublicProfile()
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    sendError(res, 'Failed to retrieve user', 500);
  }
};

const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Violation of terms' } = req.body;

    const userToban = await User.findById(id);
    if (!userToban) {
      return sendError(res, 'User not found', 404);
    }

    if (userToban.role === 'admin') {
      return sendError(res, 'Cannot ban admin users', 403);
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        status: 'banned',
        banReason: reason,
        bannedAt: new Date(),
        bannedBy: req.admin.id
      },
      { new: true }
    );

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    logger.info(`User banned: ${user.email} by ${req.admin.email}`);

    notifyUserBanned(user._id.toString(), user.name, req.admin.name);

    sendSuccess(res, 'User banned successfully', {
      user: user.getPublicProfile()
    });

  } catch (error) {
    logger.error('Ban user error:', error);
    sendError(res, 'Failed to ban user', 500);
  }
};

const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      {
        status: 'active',
        banReason: null,
        bannedAt: null,
        bannedBy: null
      },
      { new: true }
    );

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    logger.info(`User unbanned: ${user.email} by ${req.admin.email}`);

    notifyUserUnbanned(user._id.toString(), user.name, req.admin.name);

    sendSuccess(res, 'User unbanned successfully', {
      user: user.getPublicProfile()
    });

  } catch (error) {
    logger.error('Unban user error:', error);
    sendError(res, 'Failed to unban user', 500);
  }
};

const forceLogoutUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const admin = await User.findById(req.user.id);


    const { notifyForceLogout } = require('../utils/socket');
    notifyForceLogout(userId, user.username, admin.username);

    res.status(200).json({
      success: true,
      message: `User ${user.username} has been forced to logout`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return sendError(res, 'Email already in use', 400);
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(status && { status })
      },
      { new: true }
    );

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    logger.info(`User updated: ${user.email} by ${req.admin.email}`);

    sendSuccess(res, 'User updated successfully', {
      user: user.getPublicProfile()
    });

  } catch (error) {
    logger.error('Update user error:', error);
    sendError(res, 'Failed to update user', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return sendError(res, 'User not found', 404);
    }

    if (userToDelete.role === 'admin') {
      return sendError(res, 'Cannot delete admin users', 403);
    }

    if (userToDelete._id.toString() === req.admin._id.toString()) {
      return sendError(res, 'Cannot delete your own account', 400);
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    logger.info(`User deleted: ${user.email} by ${req.admin.email}`);

    sendSuccess(res, 'User deleted successfully', {
      deletedUserId: id
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    sendError(res, 'Failed to delete user', 500);
  }
};

module.exports = {
  adminLogin,
  getAllUsers,
  getUserById,
  updateUserStatus,
  banUser,
  unbanUser,
  forceLogoutUser,
  updateUser,
  deleteUser,
  getDashboardStats
};