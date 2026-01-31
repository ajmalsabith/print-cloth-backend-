const express = require('express')
const { authenticateUser } = require('../middlewares/auth')
const CartController = require('../controllers/cartController')

const router = express.Router()

//cart api handlers
router.get('/', authenticateUser, CartController.fetchCart)
router.post('/', authenticateUser, CartController.addToCart)
router.put('/', authenticateUser, CartController.syncCart)
router.put('/size', authenticateUser, CartController.updateSize)
router.delete('/', authenticateUser, CartController.removeFromCart)



module.exports = router