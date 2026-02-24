const express = require('express')
const { authenticateUser, authenticateCart } = require('../middlewares/auth')
const CheckoutController = require('../controllers/checkoutController.js')

const router = express.Router()

//checkout api handlers
router.post('/', authenticateUser, CheckoutController.fetchCheckout)
router.post('/:checkoutId/apply-coupon', authenticateUser, CheckoutController.applyCoupon)
router.patch('/:checkoutId/payment-method', authenticateUser, CheckoutController.selectPaymentMethod)
router.delete('/:checkoutId/remove-coupon', authenticateUser, CheckoutController.removeCoupon)

module.exports = router