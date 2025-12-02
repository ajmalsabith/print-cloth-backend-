const Stock = require("../models/stock");

// Create Stock
const createStock = async (req, res) => {
  try {
    const stock = await Stock.create(req.body);
    res.status(201).json({ success: true, stock });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

//  Get All Stock
const getAllStock = async (req, res) => {
  try {
    const stock = await Stock.find()
      .populate("category")
      .populate("subcategory");

    res.json({ success: true, stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  Get One Stock
const getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id)
      .populate("category")
      .populate("subcategory");

    if (!stock) return res.status(404).json({ message: "Stock not found" });

    res.json({ success: true, stock });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update Stock
const updateStock = async (req, res) => {
  try {
    const updated = await Stock.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Stock not found" });

    res.json({ success: true, updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete Stock
const deleteStock = async (req, res) => {
  try {
    const deleted = await Stock.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Stock not found" });

    res.json({ success: true, message: "Stock deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark Stock as Inactive (status = false)
const deactivateStock = async (req, res) => {
  try {
    const stock = await Stock.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!stock) return res.status(404).json({ message: "Stock not found" });

    res.json({ success: true, message: "Stock deactivated", stock });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Mark Stock as Active (status = true)
const activateStock = async (req, res) => {
  try {
    const stock = await Stock.findByIdAndUpdate(
      req.params.id,
      { status: true },
      { new: true }
    );

    if (!stock) return res.status(404).json({ message: "Stock not found" });

    res.json({ success: true, message: "Stock activated", stock });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


module.exports={

    getAllStock,
    getStockById,
    deleteStock,
    activateStock,
    deactivateStock,
    createStock,
    updateStock
    
}