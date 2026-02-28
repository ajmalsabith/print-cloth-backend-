const express = require('express')
const { authenticateUser, authenticateAdmin } = require('../middlewares/auth')
const { fetchOrder, updateOrderStatus } = require('../controllers/orderController')
const router = express.Router()

router.get('/', authenticateUser, fetchOrder)
// router.get('/:orderId', authenticateUser, OrderController.fetchOrderById)
// router.put('/:orderId/cancel', authenticateUser, OrderController.cancelOrder)
// router.put('/:orderId/return', authenticateUser, OrderController.returnOrderRequest)

// module.exports = router

module.exports = router