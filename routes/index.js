const config = require('../config/config');
const { createAuthLimiter } = require('../middlewares/setup');

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const userRoutes = require('./user');
const cartRoutes = require('./cart');
const couponRoutes = require('./coupon');
const bannerRoutes = require('./banner');
const checkoutRoutes = require('./checkout');
// const orderRoutes = require('./order');
const paymentRoutes = require('./payment');

const setupRoutes = (app) => {
    const authLimiter = createAuthLimiter();
    const shouldUseAuthLimiter = config.NODE_ENV === 'production';

    app.use('/api/auth', shouldUseAuthLimiter ? authLimiter : [], authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api', userRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/coupon', couponRoutes);
    app.use('/api/banner', bannerRoutes);
    app.use('/api/checkout', checkoutRoutes);
    // app.use('/api/order', orderRoutes);
    app.use('/api/payment', paymentRoutes);
};

module.exports = {
    setupRoutes
};