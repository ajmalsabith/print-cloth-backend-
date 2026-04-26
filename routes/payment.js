const express = require('express')
const { authenticateUser } = require('../middlewares/auth')
const { createOrder, createRazorpayOrder, verifyRazorpayOrder } = require('../controllers/paymentController.js')
const { limiter } = require('../middlewares/rateLimiter.js')
const router = express.Router()

router.post('/razorpay/create-order', authenticateUser, limiter, createRazorpayOrder)
router.post('/create-order', authenticateUser, limiter, createOrder)
router.post('/razorpay/verify', authenticateUser, limiter, verifyRazorpayOrder)




module.exports = router