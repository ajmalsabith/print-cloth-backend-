const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateUser } = require('../middlewares/auth');
const checkUserStatus = require('../middlewares/checkUserStatus');
const { limiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', limiter, AuthController.register);
router.post('/login', limiter, checkUserStatus, AuthController.login);

router.get('/me', checkUserStatus, authenticateUser, AuthController.getProfile);
router.put('/profile', checkUserStatus, authenticateUser, AuthController.updateProfile);
router.put('/change-password', limiter, checkUserStatus, authenticateUser, AuthController.changePassword);
router.post('/logout', checkUserStatus, authenticateUser, AuthController.logout);

module.exports = router;