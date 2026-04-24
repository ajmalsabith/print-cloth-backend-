const express = require('express')
const { authenticateUser } = require('../middlewares/auth')
const { createOrder, createRazorpayOrder, verifyRazorpayOrder } = require('../controllers/paymentController.js')
const router = express.Router()

router.post('/razorpay/create-order', authenticateUser, createRazorpayOrder)
router.post('/create-order', authenticateUser, createOrder)
router.post('/razorpay/verify', authenticateUser, verifyRazorpayOrder)




module.exports = router