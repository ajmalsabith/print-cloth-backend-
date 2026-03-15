const express = require('express')
const { authenticateUser, authenticateCart } = require('../middlewares/auth')
const CartController = require('../controllers/cartController')

const router = express.Router()

//cart api handlers
router.get('/', CartController.fetchCart)
router.post('/', authenticateCart, CartController.addToCart)
router.put('/', authenticateCart, CartController.syncCart)
router.put('/size', authenticateCart, CartController.updateSize)
router.delete('/', authenticateCart, CartController.removeFromCart)
router.post('/merge', authenticateCart, CartController.mergeCart)

module.exports = router