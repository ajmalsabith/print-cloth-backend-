const User = require('../models/User');
const logger = require('../utils/logger');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const existingAdmin = await User.findByEmail(adminEmail);

    if (!existingAdmin) {
      const admin = new User({
        name: 'Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        status: 'active'
      });

      await admin.save();
      logger.info(`Admin user created with email: ${adminEmail}`);
    } else {
      logger.info('Admin user already exists');
    }
  } catch (error) {
    logger.error('Error seeding admin user:', error);
  }
};

const seedSampleUsers = async () => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user',
        status: 'active'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user',
        status: 'active'
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: 'password123',
        role: 'user',
        status: 'banned'
      }
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findByEmail(userData.email);
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        logger.info(`Sample user created: ${userData.email}`);
      }
    }
  } catch (error) {
    logger.error('Error seeding sample users:', error);
  }
};

const runSeeders = async () => {
  try {
    await seedAdmin();
    await seedSampleUsers();
    logger.info('Database seeding completed');
  } catch (error) {
    logger.error('Database seeding failed:', error);
  }
};

module.exports = {
  runSeeders,
  seedAdmin,
  seedSampleUsers
};