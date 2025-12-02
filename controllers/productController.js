const Product = require("../models/products");

//  Create product
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("categoryId")
      .populate("stock");

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  Get single product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("categoryId")
      .populate("stock");

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//  Update product
const updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//    Deactivate product
const deactivateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, message: "Product deactivated", product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Activate product
const activateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, message: "Product activated", product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};



module.exports ={
    getProductById,
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    activateProduct,
    deactivateProduct
}