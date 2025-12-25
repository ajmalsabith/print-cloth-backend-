const config = require('../config/config');
const { createAuthLimiter } = require('../middlewares/setup');

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const userRoutes = require('./user');

const setupRoutes = (app) => {
    const authLimiter = createAuthLimiter();
    const shouldUseAuthLimiter = config.NODE_ENV === 'production';

    app.use('/api/auth', shouldUseAuthLimiter ? authLimiter : [], authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api', userRoutes);
};

module.exports = {
    setupRoutes
};