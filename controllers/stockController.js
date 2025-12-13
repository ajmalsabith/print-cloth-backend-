const Stock = require("../models/stock");
const { sendSuccess } = require("./BaseController");

// Create Stock
const createStock = async (req, res) => {
  try {
    console.log('in seerver ', req.body);
    
    const stock = await Stock.create(req.body);
    sendSuccess(res, 'Stock added successfully', stock, 201)
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

//  Get All Stock
const getAllStock = async (req, res) => {
  try {
    const { search = "" } = req.query;
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const pipeline = [
      // Join category
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
    ];

    // 🔍 Search filter (only if search exists)
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "category.category": { $regex: search, $options: "i" } },
            { subCategory: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Pagination
    pipeline.push(
      { $skip: skip },
      { $limit: limit }
    );

    const stocks = await Stock.aggregate(pipeline);

    // Total count (for pagination)
    const countPipeline = pipeline.filter(
      stage => !stage.$skip && !stage.$limit
    );

    const total = await Stock.aggregate([
      ...countPipeline,
      { $count: "count" },
    ]);
    const totalItems = total[0]?.count
    const totalPages = Math.ceil(totalItems/limit)

    const data = {
      stocks,
      pagination: {
        page: page,
        limit,
        totalItems,
        totalPages
      }
    }

    sendSuccess(res, 'Stocks retrived successfully', data, 200)

  } catch (err) {
    throw err
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
    const updated = await Stock.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

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

module.exports = {
  getAllStock,
  getStockById,
  deleteStock,
  activateStock,
  deactivateStock,
  createStock,
  updateStock,
};
