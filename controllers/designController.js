const Design = require("../models/design");
const logger = require("../utils/logger");
const { uploadDesignValidation } = require("../utils/validation");
const { validateRequest, asyncHandler } = require("./BaseController");

// Create a design
const uploadDesign = asyncHandler(
    async (req, res) => {
  try {
      
      const validatedData = validateRequest(uploadDesignValidation, req.body)
      console.log('formdata', validatedData);
    const design = await Design.create(validatedData)
    res.status(201).json({ success: true, message: 'Design uploaded successfully' , data: design })
  } catch (err) {
    logger.error(err)
    throw err
  }
}
)

module.exports = {
    uploadDesign
}