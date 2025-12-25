const express = require('express');
const productCtrl = require('../controllers/productController')

const router = express.Router();

router.get('/product', productCtrl.getAllProducts);
router.post('/product/:id', productCtrl.getProductById);

module.exports = router;