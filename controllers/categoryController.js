const Category = require("../models/category");
const { sendSuccess } = require("./BaseController");

// Create Category
const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, message: 'Category added successfully' , data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Categories
const getAllCategories = async (req, res) => {
  try {
    const { search } = req.query
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    const skip = (page-1)*limit
    
    const filter = {}
    if (search) filter.$or = [{category:{$regex: search, $options: 'i'}},
                              {subCategory:{$regex: search, $options: 'i'}}]

    const [ categories, totalCategories ] = await Promise.all([Category.find(filter).skip(skip).limit(limit),
      Category.countDocuments()
    ])

    const data = {
      categories,
      pagination: {
        currentPage: page,
        totalItems: totalCategories,
        totalPages: Math.ceil(totalCategories/limit)
      }
    }

    sendSuccess(res,'Categories fetched',data,200)
    
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//Get Category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) return res.status(404).json({ message: "Category not found" });

    res.json({ success: true, category });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//  Update Category
const updateCategory = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Category not found" });

    res.json({ success: true, message: 'Category updated successfully', data: updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//  Delete Category
const deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Category not found" });

    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Deactivate Category
const deactivateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });

    res.json({ success: true, message: "Category deactivated", category });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Activate Category
const activateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });

    res.json({ success: true, message: "Category activated", category });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


module.exports={

    createCategory,
    updateCategory,
    deleteCategory,
    activateCategory,
    deactivateCategory,
    getAllCategories,
    getCategoryById

}