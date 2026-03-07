const express = require('express')
const { authenticateUser, authenticateAdmin } = require('../middlewares/auth')
const { fetchOrder, updateOrderStatus, fetchOrderById, downloadInvoice } = require('../controllers/orderController')
const router = express.Router()

router.get('/', authenticateUser, fetchOrder)
router.get('/:orderId', authenticateUser, fetchOrderById)
router.get('/:orderId/invoice', authenticateUser, downloadInvoice)
// router.put('/:orderId/cancel', authenticateUser, OrderController.cancelOrder)
// router.put('/:orderId/return', authenticateUser, OrderController.returnOrderRequest)

// module.exports = router

module.exports = router