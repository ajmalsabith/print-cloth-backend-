const Category = require("../models/category");
const Product = require("../models/product");
const logger = require("../utils/logger");
const { sendSuccess, sendError } = require("./BaseController");

//  ADD PRODUCT
const createProduct = async (req, res) => {
  try {
    const { sizes, colors, designTemplates, type } = req.body;

    console.log("req body:", req.body);

    const sizesArray = sizes.split(",");
    const colorsArray = colors.split(",");

    let designTemplatesArray = [];
    if (designTemplates) designTemplatesArray = designTemplates.split(",");

    console.log("sizesArray", sizesArray);
    console.log("colorsArray", colorsArray);
    console.log("designTemplatesArray", designTemplatesArray);

    const frontImage = req.files["images.front"]?.[0];
    const backImage = req.files["images.back"]?.[0];

    const images = {
      front: frontImage?.path,
      back: backImage?.path,
    };
    let imagePublicId = [frontImage.filename, backImage.filename];

    const product = await Product.create({
      ...req.body,
      images,
      imagePublicId,
      subCategory: type,
      sizes: sizesArray,
      colors: colorsArray,
      designTemplates: designTemplatesArray,
    });

    console.log("product", product);
    sendSuccess(res, "Product added successfully", { product }, 201);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET ALL PRODUCTS
const getAllProducts = async (req, res) => {
  try {
    const { search, status, categories, subCategories } = req.query;

    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit) || 16;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search)
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { targetAudience: { $regex: search, $options: "i" } },
        { subCategory: { $regex: search, $options: "i" } },
      ];
    if (status) filter.status = status;
    //category id array
    if (Array.isArray(categories) && categories.length > 0) {
      filter.categoryId = { $in: categories };
    }
    //subcategory string array
    if (Array.isArray(subCategories) && subCategories.length > 0) {
      filter.subCategory = { $in: subCategories };
    }

    const [products, totalProducts, categoryList] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit),
      Product.countDocuments(filter),
      Category.find({ isActive: true }).select({
        _id: 1,
        category: 1,
        subCategory: 1,
      }),
    ]);

    logger.info("Products fetched successfully");

    sendSuccess(
      res,
      "Products fetched successfully",
      (data = {
        products,
        pagination: {
          page,
          totalProducts,
          totalPages: Math.ceil(totalProducts / limit),
          limit: limit,
        },
        categoryList
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "categoryId"
    );
    // .populate("stock");

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//  UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated) return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//DEACTIVATE PRODUCT
const deactivateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).populate("categoryId");

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, message: "Product deactivated", product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ACTIVATE PRODUCT
const activateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).populate("categoryId");

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, message: "Product activated", product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// TOGGLE POPULARITY STATUS
const toggleIsPopular = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "categoryId"
    );

    if (!product) return res.status(404).json({ message: "Product not found" });

    product.isPopular === true
      ? (product.isPopular = false)
      : (product.isPopular = true);

    await product.save();

    res.json({ success: true, message: "Product popularity changed", product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getProductById,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  activateProduct,
  deactivateProduct,
  toggleIsPopular,
};
