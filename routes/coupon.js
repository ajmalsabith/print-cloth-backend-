const express = require('express')
const { authenticateAdmin } = require('../middlewares/auth')
const CouponController = require('../controllers/couponController')

const router = express.Router()

//coupon api handlers
router.get('/', authenticateAdmin, CouponController.fetchCoupons)
router.post('/', authenticateAdmin, CouponController.addCoupon)
router.put('/:couponId',authenticateAdmin ,CouponController.updateCoupon)
router.delete('/:couponId', authenticateAdmin, CouponController.deleteCoupon)

module.exports = router