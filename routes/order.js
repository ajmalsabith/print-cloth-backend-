const express = require('express')
const { authenticateUser } = require('../middlewares/auth')
const { fetchUserOrder } = require('../controllers/orderController')
const router = express.Router()

router.get('/', authenticateUser, fetchUserOrder)
// router.get('/:orderId', authenticateUser, OrderController.fetchOrderById)
// router.put('/:orderId/cancel', authenticateUser, OrderController.cancelOrder)
// router.put('/:orderId/return', authenticateUser, OrderController.returnOrderRequest)

// module.exports = router

module.exports = router