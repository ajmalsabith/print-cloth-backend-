
const Product = require("../models/product");
const { sendSuccess } = require("./BaseController");

//  ADD PRODUCT
const createProduct = async (req, res) => {
  try {
    const { sizes, colors, designTemplates, type } = req.body

    console.log('req body:',req.body);
    

    const sizesArray = sizes.split(',')
    const colorsArray = colors.split(',')

    let designTemplatesArray = []
    if (designTemplates) designTemplatesArray = designTemplates.split(',')
    
    console.log('sizesArray', sizesArray);
    console.log('colorsArray', colorsArray);
    console.log('designTemplatesArray', designTemplatesArray);
    
    const frontImage = req.files['images.front']?.[0]
    const backImage = req.files['images.back']?.[0]

    const images = {
      front: frontImage?.path,
      back: backImage?.path,
    }
    let imagePublicId = [frontImage.filename, backImage.filename]

    const product = await Product.create({
      ...req.body,
      images,
      imagePublicId,
      subCategory: type,
      sizes: sizesArray,
      colors: colorsArray,
      designTemplates: designTemplatesArray
    })

    console.log('product', product);
    sendSuccess(res, 'Product added successfully', {product}, 201)
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const { search= '' } = req.query
    
    console.log('search', search);
    
      let filter = {}
      if (search) filter.$or = [
        {name: {$regex: search, $options: 'i'}},
        // category: {$regex: search, $options: 'i'},
        {subCategory: {$regex: search, $options: 'i'}},
      ]

      console.log('filter:', filter);
      

      const products = await Product.find(filter)
      .populate("categoryId")

      console.log('fetched products:', products);
      

    return sendSuccess(res, 'Products fetched successfully', {products}, 200)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  Get single product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("categoryId")
      // .populate("stock");

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
    ).populate('categoryId')

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
    ).populate('categoryId')

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, message: "Product activated", product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// TOGGLE POPULARITY STATUS
const toggleIsPopular = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId')

    if (!product) return res.status(404).json({ message: "Product not found" });

    product.isPopular === true ? product.isPopular = false : product.isPopular = true

    await product.save()

    res.json({ success: true, message: "Product popularity changed", product });
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
    deactivateProduct,
    toggleIsPopular
}