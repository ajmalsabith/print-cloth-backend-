const Design = require("../models/design");
const { uploadDesignValidation } = require("../utils/validation");
const { validateRequest } = require("./BaseController");

// Create a design
const uploadDesign = async (req, res) => {
  try {
    const validatedData = validateRequest(uploadDesignValidation, req.body)
    const design = await Design.create(validatedData)
    res.status(201).json({ success: true, message: 'Design uploaded successfully' , data: design })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
};

module.exports = {
    uploadDesign
}