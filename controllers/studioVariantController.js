const { NotFoundError } = require("../utils/errors");
const { validateRequest, sendSuccess } = require("./BaseController");
const { createVariantValidation } = require("../utils/validation");
const StudioVariant = require("../models/StudioBaseVariant");


const CANVAS_W = 400; // fixed canvas width — must match frontend

function computePrintableAreaCm(area, shirtWidthCm) {
  const pxToCm = shirtWidthCm / CANVAS_W;
  return {
    ...area,
    widthCm:               +(area.width  * pxToCm).toFixed(2),
    heightCm:              +(area.height * pxToCm).toFixed(2),
    offsetFromShirtLeftCm: +(area.x      * pxToCm).toFixed(2),
    offsetFromShirtTopCm:  +(area.y      * pxToCm).toFixed(2),
  };
}

const addStudioVariant = async (req, res) => {
  try {
    const uploaded = req.files;
    const { category, subCategory, printableAreas } = req.body;
    let { colors, price, shirtWidthCm } = req.body;

    const sizes = JSON.parse(req.body.sizes).map((s) => s.toUpperCase());
    colors = colors ? JSON.parse(colors) : [];
    price = parseInt(price);
    console.log('shirt width:', shirtWidthCm)
    shirtWidthCm = parseFloat(shirtWidthCm);

    const normalizedColors = colors.map((c) => ({
      name: c.name,
      frontImage: c.frontImage && Object.keys(c.frontImage).length ? c.frontImage : null,
      backImage:  c.backImage  && Object.keys(c.backImage).length  ? c.backImage  : null,
    }));

    const validatedData = validateRequest(createVariantValidation, {
      category,
      subCategory,
      price,
      shirtWidthCm,
      sizes,
      colors: normalizedColors,
      printableAreas: printableAreas ? JSON.parse(printableAreas) : {},
    });

    if (uploaded?.length > 0 && validatedData.colors.length > 0) {
      validatedData.colors = validatedData.colors.map((color) => {
        const frontFile = uploaded.find((f) => f.fieldname === `front_${color.name}`);
        const backFile  = uploaded.find((f) => f.fieldname === `back_${color.name}`);
        return {
          ...color,
          frontImage: frontFile ? frontFile.path : color.frontImage,
          backImage:  backFile  ? backFile.path  : color.backImage,
        };
      });
    }

    if (validatedData.printableAreas?.front)
      validatedData.printableAreas.front = computePrintableAreaCm(validatedData.printableAreas.front, shirtWidthCm);
    if (validatedData.printableAreas?.back)
      validatedData.printableAreas.back  = computePrintableAreaCm(validatedData.printableAreas.back,  shirtWidthCm);

    const variant = new StudioVariant(validatedData);
    await variant.save();
    sendSuccess(res, "Studio variant created successfully", { variant }, 201);
  } catch (error) {
    console.log('error in han:', error)
    throw error;
  }
};

const updateStudioVariant = async (req, res) => {
  try {
    const variantId = req.params.id;
    const updateData = req.body;

    if (updateData.colors)         updateData.colors         = JSON.parse(updateData.colors);
    if (updateData.price)          updateData.price          = parseInt(updateData.price);
    if (updateData.shirtWidthCm)   updateData.shirtWidthCm   = parseFloat(updateData.shirtWidthCm);
    if (updateData.printableAreas) updateData.printableAreas = JSON.parse(updateData.printableAreas);
    if (updateData.sizes)          updateData.sizes          = JSON.parse(updateData.sizes).map((s) => s.toUpperCase());

    const uploaded = req.files;
    if (uploaded && updateData.colors) {
      updateData.colors = updateData.colors.map((color) => {
        const frontFile = uploaded.find((f) => f.fieldname === `front_${color.name}`);
        const backFile  = uploaded.find((f) => f.fieldname === `back_${color.name}`);
        return {
          ...color,
          frontImage: frontFile ? frontFile.path : color.frontImage,
          backImage:  backFile  ? backFile.path  : color.backImage,
        };
      });
    }

    if (updateData.printableAreas?.front)
      updateData.printableAreas.front = computePrintableAreaCm(updateData.printableAreas.front, updateData.shirtWidthCm);
    if (updateData.printableAreas?.back)
      updateData.printableAreas.back  = computePrintableAreaCm(updateData.printableAreas.back,  updateData.shirtWidthCm);

    const updated = await StudioVariant.findByIdAndUpdate(variantId, updateData, { new: true });
    if (!updated) throw new NotFoundError("Studio variant not found");
    sendSuccess(res, "Studio variant updated successfully", { variant: updated }, 200);
  } catch (error) {
    throw error;
  }
};

const fetchStudioVariants = async (req, res) => {
  try {
    const { clothType, clothSubcategory, clothColor } = req.query;
    const filter = {};
    if (clothType)        filter.category       = clothType;
    if (clothSubcategory) filter.subCategory    = clothSubcategory;
    if (clothColor)       filter["colors.name"] = clothColor;
    const variants = await StudioVariant.find(filter);
    sendSuccess(res, "Studio variants fetched successfully", { variants }, 200);
  } catch (error) {
    throw error;
  }
};

const deleteStudioVariant = async (req, res) => {
  try {
    const deleted = await StudioVariant.findByIdAndDelete(req.params.id);
    if (!deleted) throw new NotFoundError("Studio variant not found");
    sendSuccess(res, "Studio variant deleted successfully", { variant: deleted }, 200);
  } catch (error) {
    throw error;
  }
};

module.exports = { addStudioVariant, updateStudioVariant, fetchStudioVariants, deleteStudioVariant };