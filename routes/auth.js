const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateUser } = require('../middlewares/auth');
const checkUserStatus = require('../middlewares/checkUserStatus');

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', checkUserStatus, AuthController.login);

router.get('/me', checkUserStatus, authenticateUser, AuthController.getProfile);
router.put('/profile', checkUserStatus, authenticateUser, AuthController.updateProfile);
router.put('/change-password', checkUserStatus, authenticateUser, AuthController.changePassword);
router.post('/logout', checkUserStatus, authenticateUser, AuthController.logout);

module.exports = router;