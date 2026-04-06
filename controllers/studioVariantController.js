const { NotFoundError } = require("../utils/errors");
const { validateRequest, sendSuccess } = require("./BaseController");
const { createVariantValidation, updateVariantValidation } = require("../utils/validation");
const logger = require("../utils/logger");
const StudioVariant = require("../models/StudioBaseVariant");

// CREATE VARIANT
const addStudioVariant = async (req, res) => {
  try {
    const uploaded = req.files; // array of uploaded files if needed
    console.log('img:', uploaded);

    const { category, subCategory, printableAreas } = req.body;
    let { colors, price } = req.body
    
    colors = colors ? JSON.parse(colors) : []
    price = parseInt(price)
    const normalizedColors = colors.map(c => ({
  name: c.name,
  frontImage: c.frontImage && Object.keys(c.frontImage).length ? c.frontImage : null,
  backImage: c.backImage && Object.keys(c.backImage).length ? c.backImage : null
}));

    // Validate request body
    const validatedData = validateRequest(createVariantValidation, {
      category,
      subCategory,
      price,
      colors: normalizedColors,
      printableAreas: printableAreas ? JSON.parse(printableAreas) : {},
    });
    

    // Map uploaded files to colors
    if (uploaded && uploaded.length > 0 && validatedData.colors.length > 0) {
      validatedData.colors = validatedData.colors.map((color, index) => {
        const frontFile = uploaded.find(f => f.fieldname === `front_${color.name}`);
        const backFile = uploaded.find(f => f.fieldname === `back_${color.name}`);
        return {
          ...color,
          frontImage: frontFile ? frontFile.path : color.frontImage,
          backImage: backFile ? backFile.path : color.backImage,
        };
      });
    }

    const variant = new StudioVariant(validatedData);
    await variant.save();

    sendSuccess(res, "Studio variant created successfully", { variant }, 201);
  } catch (error) {
    throw error;
  }
};

// UPDATE VARIANT
const updateStudioVariant = async (req, res) => {
  try {
    const variantId = req.params.id;
    const updateData = req.body;

    console.log('variantId', updateData);
    
    // Parse JSON fields if needed
    if (updateData.colors) updateData.colors = JSON.parse(updateData.colors);
    if(updateData.price) updateData.price = parseInt(updateData.price)
    if (updateData.printableAreas) updateData.printableAreas = JSON.parse(updateData.printableAreas);

    // Optionally handle uploaded files
    const uploaded = req.files;
    
    if (uploaded && updateData.colors) {
        console.log('in edit api')
      updateData.colors = updateData.colors.map(color => {
        const frontFile = uploaded.find(f => f.fieldname === `front_${color.name}`);
        const backFile = uploaded.find(f => f.fieldname === `back_${color.name}`);
        return {
          ...color,
          frontImage: frontFile ? frontFile.path : color.frontImage,
          backImage: backFile ? backFile.path : color.backImage,
        };
      });
    }
    console.log('updateVariant:', updateData);
    

    const updated = await StudioVariant.findByIdAndUpdate(variantId, updateData, { new: true });
    if (!updated) throw new NotFoundError("Studio variant not found");

    sendSuccess(res, "Studio variant updated successfully", { variant: updated }, 200);
  } catch (error) {
    throw error;
  }
};

// FETCH ALL VARIANTS
const fetchStudioVariants = async (req, res) => {
  try {
    const { category='men', subCategory='regular', color='white' } = req.query

    let filter = {}

    if(category) filter.category = category
    if(subCategory) filter.subCategory = subCategory
    if(color) filter["colors.name"] = color
console.log('filter:', filter);

    const variants = await StudioVariant.find(filter);
console.log('vRIANTS:', variants);

    sendSuccess(res, "Studio variants fetched successfully", { variants }, 200);
  } catch (error) {
    throw error;
  }
};

// DELETE VARIANT
const deleteStudioVariant = async (req, res) => {
  try {
    const variantId = req.params.id;
    const deleted = await StudioVariant.findByIdAndDelete(variantId);
    if (!deleted) throw new NotFoundError("Studio variant not found");

    sendSuccess(res, "Studio variant deleted successfully", { variant: deleted }, 200);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  addStudioVariant,
  updateStudioVariant,
  fetchStudioVariants,
  deleteStudioVariant,
};