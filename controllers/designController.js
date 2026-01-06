const Design = require("../models/design");
const router = require("../routes/uploads");
const logger = require("../utils/logger");
const { uploadDesignValidation, editDesignValidation } = require("../utils/validation");
const cloudinary = require("../config/cloudinary");
const {
  validateRequest,
  asyncHandler,
  sendSuccess,
  sendError,
} = require("./BaseController");
const BaseController = require("./BaseController");
const { NotFoundError } = require("../utils/errors");

// UPLOAD A DESIGN
const uploadDesign = asyncHandler(async (req, res) => {
  try {

    const { designName, designType, category, tags, visibility, isPopular } = req.body;

    const tagArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "")
    
    const validatedData = validateRequest(uploadDesignValidation, {
      designName,
      designType,
      isPopular,
      category,
      tags: tagArray,
      visibility,
    });
    if (req.admin?.role === "admin") validatedData.status = "active";
    console.log("validated data", validatedData);

    const uploaded = req.file;

    if (!req.file) {
      console.log('in here');
      throw new NotFoundError('Image file not found')
    }
    
    validatedData.imageURL = uploaded.path;
    validatedData.imagePublicId = uploaded.filename;

    const design = await Design.create(validatedData);

    console.log('design:', design);
    

    logger.info(
      `Design ${design.designName} uploaded by name:${req.admin?.name}, role:${req.admin?.role}`
    );

    sendSuccess(res, "Design uploaded successfully", design);
  } catch (err) {
    logger.error(err);
    throw err;
  }
});

// GET ALL DESIGNS
const getAllDesigns = asyncHandler(async (req, res) => {
  try {
    const { search, status, categories } = req.query;

    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit) || 16;
    const skip = (page - 1) * limit;

    console.log('categories:', categories);
    

    const filter = {};
    if (search) filter.$or = [
        { designName:{ $regex: search, $options: "i" } },
        {creatorName:{ $regex: search, $options: "i" }},
        {category:{ $regex: search, $options: "i" }},
        {designType:{ $regex: search, $options: "i" }},
        {tags:{ $regex: search, $options: "i" }},
    ];
    if (status) filter.status = status;
    if (categories) filter.category = {$in: categories}

    const totalDesigns = await Design.find(filter).countDocuments()

    const [designs, DesignCategoryList] = await Promise.all([
      Design.find(filter).skip(skip).limit(limit),
      Design.distinct('category')
    ]);
    logger.info("Designs fetched successfully");

    sendSuccess(
      res,
      "Designs retrived successfully",
      data = {
        designs,
        pagination: {
          page,
          totalItems: totalDesigns,
          totalPages: Math.ceil(totalDesigns / limit),
          limit: limit
        },
        categoryList: DesignCategoryList
      }
    );
  } catch (err) {
    logger.error(err);
    throw err;
  }
});

// GET ALL DESIGN LIST FOR PRODUCT FORM
const fetchSelectDesigns = asyncHandler(async (req, res) => {
  const designs = await Design.find()
    .select("_id designName imageURL")
    .sort({ designName: 1 });

  sendSuccess(res, "Design list fetched successfully", {designs});
});

//DELETE A DESIGN
const deleteDesign = asyncHandler(async (req, res) => {
  try {
    const designId = req.params.id;
    console.log(designId);

    const design = await Design.findById(designId);

    if (!design) return sendError(res, "Design not found", 404);

    const publicId = design.imagePublicId;
    console.log("publicId", publicId);

    if (publicId) {
      const response = await cloudinary.uploader.destroy(publicId);
      console.log("cloud delte:", response);
    }

    await Design.findByIdAndDelete(designId);

    logger.info(`Design ${design.designName} deleted`);

    sendSuccess(res, "Design deleted successfully");
  } catch (error) {
    logger.error("Delete failed", error.message);
    throw error;
  }
});


// DESIGN APPROVE/REJECT STATUS
const updateDesignStatus = async (req, res) => {
  const { action } = req.body;

  console.log('body', action);
  

  switch (action) {
    case "toggle":
      return toggleStatusDesign(req, res);
    case "approve":
      return approveDesign(req, res);
    case "reject":
      return rejectDesign(req, res);
    default:
      return res.status(400).json({ message: "Invalid action" });
  }
};

//TOGGLE ACTIVE/INACTIVE STATUS
const toggleStatusDesign = asyncHandler(async (req, res) => {
  const design = await Design.findById(req.params.id);

  if (!design) return sendError(res, "Design not found", 404);

  if (design.status === "active" || design.status === "inactive") {
    design.status === "active"
      ? (design.status = "inactive")
      : (design.status = "active");
  } else {
    return sendError(res, "Review design before changing status!", 409);
  }
  await design.save();

  sendSuccess(res, "Updated", design);
});

//TOGGLE POPULAR STATUS
const toggleIsPopular = asyncHandler(async (req, res) => {
  const design = await Design.findById(req.params.id);

  if (!design) return sendError(res, "Design not found", 404);

  if (design.isPopular === true || design.isPopular === false) {
    design.isPopular === true
      ? (design.isPopular = false)
      : (design.isPopular = true);
  } else {
    return sendError(res, "Review design before changing popularity!", 409);
  }
  await design.save();

  sendSuccess(res, "Updated popularity", design);
});

const approveDesign = asyncHandler(async (req, res) => {

    console.log('in pyyy');
    
  const design = await Design.findById(req.params.id);

  console.log('design', design);
  

  if (!design) return sendError(res, "Design not found", 404);

  if (design.status === "pending" || design.status === "rejected") {
    design.status = "active"
  } else {
    return sendError(res, "Operation prohibited", 403);
  }
  await design.save();

  sendSuccess(res, "Updated", design);
});

const rejectDesign = asyncHandler(async (req, res) => {
  const design = await Design.findById(req.params.id);

  if (!design) return sendError(res, "Design not found", 404);

  if (design.status === "pending") {
    design.status = "rejected"
  } else {
    return sendError(res, "Operation prohibited", 403);
  }
  await design.save();

  sendSuccess(res, "Updated", design);
});

const updateDesign = asyncHandler(async (req, res) => {
  const { tags , ...rest } = req.body

  const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')

  const validatedData = BaseController.validateRequest(editDesignValidation, { ...rest, tags: tagsArray })

  const design = await Design.findByIdAndUpdate(req.params.id, validatedData, {new: true});

  if (!design) return sendError(res, "Design not found", 404);

  sendSuccess(res, "Design updated", design);
});

module.exports = {
  uploadDesign,
  getAllDesigns,
  deleteDesign,
  updateDesignStatus,
  toggleIsPopular,
  updateDesign,
  fetchSelectDesigns
};
