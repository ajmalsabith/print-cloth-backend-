const Design = require("../models/design");
const router = require("../routes/uploads");
const logger = require("../utils/logger");
const { uploadDesignValidation } = require("../utils/validation");
const cloudinary = require("../config/cloudinary");
const { validateRequest, asyncHandler, sendSuccess, sendError } = require("./BaseController");

// CREATE A DESIGN
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

// GET ALL DESIGNS
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

//DELETE A DESIGN
const deleteDesign = asyncHandler(async(req, res) => {
    try {
        const designId = req.params.id
        console.log(designId)

        const design = await Design.findById(designId)

        if (!design) return sendError(res, 'Design not found', 404)

        const publicId = design.imagePublicId
        console.log('publicId', publicId);
        
        if (publicId)  {
            const response = await cloudinary.uploader.destroy(publicId)
            console.log('cloud delte:', response);
        }
        
        await Design.findByIdAndDelete(designId)

        logger.info(`Design ${design.designName} deleted`)

        sendSuccess(res, 'Design deleted successfully')
        
    } catch (error) {
        logger.error(error.message)
        throw new Error('Delete failed', 400)
    }

})

module.exports = {
    uploadDesign,
    getAllDesigns,
    deleteDesign
}