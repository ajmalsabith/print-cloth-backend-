const express = require('express');
const productCtrl = require('../controllers/productController')
const designCtrl = require('../controllers/designController')

const router = express.Router();

//PRODUCT
router.get('/product', productCtrl.getAllProducts);
router.post('/product/:id', productCtrl.getProductById);


//DESIGN
router.get("/design", designCtrl);

module.exports = router;
