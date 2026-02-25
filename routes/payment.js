const express = require('express')
const { authenticateUser } = require('../middlewares/auth')
const { createOrder } = require('../controllers/paymentController.js')
const router = express.Router()

// router.post('/razorpay/create-order', authenticateUser, PaymentController.createRazorpayOrder)
router.post('/create-order', authenticateUser, createOrder)
// router.post('/razorpay/verify', authenticateUser, PaymentController.verifyRazorpayOrder)




module.exports = router