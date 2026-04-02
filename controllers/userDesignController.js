const UserDesign = require("../models/UserDesignSchema.js");
const { sendSuccess } = require("./BaseController.js");

const saveUserDesign = async (req, res) => {
  try {
    const payload = req.body;

    console.log("Incoming payload:", payload);

    const userId = req.user?.id || payload.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: userId missing",
      });
    }

    //Basic validation
    if (!payload.product || !payload.elements) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload structure",
      });
    }

    //Map frontend to schema
        const mappedData = {
      userId,
      designName: payload.designName || "Untitled Design",
      productId: payload.product?.variantId || null,
      source: payload.sourceType,
      clothType: payload.product?.type,
      clothSubCategory: payload.product?.subCategory,
      clothColor: payload.product?.color,

      elements: payload.elements.map((el) => ({
        side: el.side,
        type: el.type,

        designId: el.designId || null,
        imageUrl: el.imageUrl || null,

        text: el.text || null,
        fontFamily: el.fontFamily,
        fontSize: el.fontSize,
        color: el.color,

        positionX: el.positionX,
        positionY: el.positionY,

        width: el.width,
        height: el.height,

        scaleX: el.scaleX ?? 1,
        scaleY: el.scaleY ?? 1,
        rotation: el.rotation ?? 0,

        layerIndex: el.layerIndex,
      })),

      previewImage: {
        front: payload.finalImages?.front || null,
        back: payload.finalImages?.back || null,
      },

      status: "saved",
    };

    let savedDesign;

    //  Update if designId exists
    if (payload.designId) {
      savedDesign = await UserDesign.findOneAndUpdate(
        { _id: payload.designId, userId }, // ensure ownership
        { $set: mappedData },
        { new: true }
      );

      if (!savedDesign) {
        return res.status(404).json({
          success: false,
          message: "Design not found or not authorized",
        });
      }

      return sendSuccess(res, "Design saved successfully", savedDesign, 200)
    }

    // Create new design
    const newDesign = new UserDesign(mappedData);
    savedDesign = await newDesign.save();

    return sendSuccess(res, "Design saved successfully", savedDesign, 201)

  } catch (error) {
    console.error("Error saving design:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save design",
      error: error.message,
    });
  }
};

//fetch all user designs
const fetchUserDesign = async (req, res) => {
    try {
        const userDesigns = await UserDesign.find({})
        sendSuccess(res, 'User designs fetched successfully', userDesigns, 200)
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const deleteUserDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // assuming auth middleware

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Design ID is required",
      });
    }

    const design = await UserDesign.findById(id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: "Design not found",
      });
    }

    // Optional but recommended: ensure user owns the design
    // if (design.user.toString() !== userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Unauthorized to delete this design",
    //   });
    // }

    await UserDesign.findByIdAndDelete(id);

    return sendSuccess(res, "User design deleted successfully", {designId: id}, 200)
  } catch (error) {
    console.error("Delete Design Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting design",
    });
  }
};

module.exports = { 
    saveUserDesign,
    fetchUserDesign,
    deleteUserDesign
 };