const express = require('express');
const {
  adminLogin,
  getAllUsers,
  addUser,
  getUserById,
  updateUserStatus,
  banUser,
  unbanUser,
  forceLogoutUser,
  updateUser,
  deleteUser,
  getDashboardStats
} = require('../controllers/adminController');
const { authenticateAdmin } = require('../middlewares/auth');

const productCtrl = require('../controllers/productController')
const stockCtrl = require('../controllers/stockController')
const categoryCtrl = require('../controllers/categoryController')
const designCtrl = require('../controllers/designController')
const router = express.Router();

router.post('/login', adminLogin);
router.get('/users', authenticateAdmin, getAllUsers);
router.get('/users/:id', authenticateAdmin, getUserById);
router.post('/users', authenticateAdmin, addUser);
router.put('/users/:id', authenticateAdmin, updateUser);
router.delete('/users/:id', authenticateAdmin, deleteUser);
router.post('/users/:id/ban', authenticateAdmin, banUser);
router.post('/users/:id/unban', authenticateAdmin, unbanUser);
router.post('/users/:id/force-logout', authenticateAdmin, forceLogoutUser);
router.patch('/user/:id/status', authenticateAdmin, updateUserStatus);
router.get('/stats', authenticateAdmin, getDashboardStats);



// products 

router.post("/product", productCtrl.createProduct);
router.get("/product", productCtrl.getAllProducts);
router.get("/product/:id", productCtrl.getProductById);
router.put("/product/:id", productCtrl.updateProduct);
router.delete("/product/:id", productCtrl.deleteProduct);

router.put("/product/deactivate/:id", productCtrl.deactivateProduct);
router.put("/product/activate/:id", productCtrl.activateProduct);


// category 

router.post("/category", categoryCtrl.createCategory);
router.get("/category", categoryCtrl.getAllCategories);
router.get("/category/:id", categoryCtrl.getCategoryById);
router.put("/category/:id", categoryCtrl.updateCategory);
router.delete("/category/:id", categoryCtrl.deleteCategory);

router.put("/category/deactivate/:id", categoryCtrl.deactivateCategory);
router.put("/category/activate/:id", categoryCtrl.activateCategory);


// stock 

router.post("/stock", stockCtrl.createStock);
router.get("/stock", stockCtrl.getAllStock);
router.get("/stock/:id", stockCtrl.getStockById);
router.put("/stock/:id", stockCtrl.updateStock);
router.delete("/stock/:id", stockCtrl.deleteStock);

router.put("/stock/deactivate/:id", stockCtrl.deactivateStock);
router.put("/stock/activate/:id", stockCtrl.activateStock);


// designs 

router.get("/design", authenticateAdmin , designCtrl.getAllDesigns);
router.post("/design", authenticateAdmin , designCtrl.uploadDesign);
router.delete("/design/:id" , designCtrl.deleteDesign);


module.exports = router;