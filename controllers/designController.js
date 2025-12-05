const Design = require("../models/design");
const logger = require("../utils/logger");
const { uploadDesignValidation } = require("../utils/validation");
const { validateRequest, asyncHandler, sendSuccess } = require("./BaseController");

// Create a design
const uploadDesign = asyncHandler(
    async (req, res) => {
  try {
      const validatedData = validateRequest(uploadDesignValidation, req.body)
     const design = await Design.create(validatedData)

     logger.info(`Design ${design.designName} uploaded by name:${req.admin.name}, role:${req.admin.role}` )
     
     sendSuccess(res, 'Design uploaded successfully', data= design)

      } catch (err) {
        logger.error(err)
        throw err
      }
  }
)

// Get all designs
const getAllDesigns = asyncHandler(
    async (req, res) => {
  try {
    const { search } = req.query

    const page = parseInt(req.body.page)
    const limit = parseInt(req.body.limit)
    const skip = (page-1)*limit

    const filter = {}
    if (search) filter.designName = {$regex: search, $options: 'i'}

    const [designs, totalDesigns] = await Promise.all([Design.find(filter).skip(skip).limit(limit)])

    totalPages = 

    logger.info('Designs fetched successfully')
    
    sendSuccess(res, 'Designs retrived successfully', data= {
        designs,
        pagination: {
            currentPage: page,
            totalItems: totalDesigns,
            totalPages: Math.ceil(totalDesigns/limit)
        }
    })
      } catch (err) {
    logger.error(err)
    throw err
      }
  }
)

module.exports = {
    uploadDesign,
    getAllDesigns
}