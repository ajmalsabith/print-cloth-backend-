// const { NotFoundError } = require("../utils/errors");
// const { validateRequest, sendSuccess } = require("./BaseController");
// const { createVariantValidation, updateVariantValidation } = require("../utils/validation");
// const logger = require("../utils/logger");
// const StudioVariant = require("../models/StudioBaseVariant");

// // CREATE VARIANT
// const addStudioVariant = async (req, res) => {
//   try {
//     const uploaded = req.files; // array of uploaded files if needed
//     console.log('img:', uploaded);

//     const { category, subCategory, printableAreas } = req.body;
//     let { colors, price } = req.body

//     const generalSizes = JSON.parse(req.body.sizes);
//     const sizes = generalSizes.map(size => size.toUpperCase());
//     console.log('sizes:', sizes)
//     colors = colors ? JSON.parse(colors) : []
//     price = parseInt(price)
//     const normalizedColors = colors.map(c => ({
//   name: c.name,
//   frontImage: c.frontImage && Object.keys(c.frontImage).length ? c.frontImage : null,
//   backImage: c.backImage && Object.keys(c.backImage).length ? c.backImage : null
// }));

//     // Validate request body
//     const validatedData = validateRequest(createVariantValidation, {
//       category,
//       subCategory,
//       price,
//       sizes,
//       colors: normalizedColors,
//       printableAreas: printableAreas ? JSON.parse(printableAreas) : {},
//     });
    

//     // Map uploaded files to colors
//     if (uploaded && uploaded.length > 0 && validatedData.colors.length > 0) {
//       validatedData.colors = validatedData.colors.map((color, index) => {
//         const frontFile = uploaded.find(f => f.fieldname === `front_${color.name}`);
//         const backFile = uploaded.find(f => f.fieldname === `back_${color.name}`);
//         return {
//           ...color,
//           frontImage: frontFile ? frontFile.path : color.frontImage,
//           backImage: backFile ? backFile.path : color.backImage,
//         };
//       });
//     }

//     if(validatedData.printableAreas.front.width) validatedData.printableAreas.front.realWidthCm = validatedData.printableAreas.front.width/10
//     if(validatedData.printableAreas.front.height) validatedData.printableAreas.front.realHeightCm = validatedData.printableAreas.front.height/10
//     if(validatedData.printableAreas.back.width) validatedData.printableAreas.back.realWidthCm = validatedData.printableAreas.back.width/10
//     if(validatedData.printableAreas.back.height) validatedData.printableAreas.back.realHeightCm = validatedData.printableAreas.back.height/10

//     const variant = new StudioVariant(validatedData);
//     await variant.save();

//     sendSuccess(res, "Studio variant created successfully", { variant }, 201);
//   } catch (error) {
//     throw error;
//   }
// };

// // UPDATE VARIANT
// const updateStudioVariant = async (req, res) => {
//   try {
//     const variantId = req.params.id;
//     const updateData = req.body;

//     console.log('variantId', updateData);
    
//     // Parse JSON fields if needed
//     if (updateData.colors) updateData.colors = JSON.parse(updateData.colors);
//     if(updateData.price) updateData.price = parseInt(updateData.price)
//     if (updateData.printableAreas) updateData.printableAreas = JSON.parse(updateData.printableAreas);
//     if (updateData.sizes) updateData.sizes = JSON.parse(updateData.sizes).map(size => size.toUpperCase());;

//     // Optionally handle uploaded files
//     const uploaded = req.files;
    
//     if (uploaded && updateData.colors) {
//         console.log('in edit api')
//       updateData.colors = updateData.colors.map(color => {
//         const frontFile = uploaded.find(f => f.fieldname === `front_${color.name}`);
//         const backFile = uploaded.find(f => f.fieldname === `back_${color.name}`);
//         return {
//           ...color,
//           frontImage: frontFile ? frontFile.path : color.frontImage,
//           backImage: backFile ? backFile.path : color.backImage,
//         };
//       });
//     }

//     if(updateData.printableAreas.front.width) updateData.printableAreas.front.realWidthCm = updateData.printableAreas.front.width/10
//     if(updateData.printableAreas.front.height) updateData.printableAreas.front.realHeightCm = updateData.printableAreas.front.height/10
//     if(updateData.printableAreas.back.width) updateData.printableAreas.back.realWidthCm = updateData.printableAreas.back.width/10
//     if(updateData.printableAreas.back.height) updateData.printableAreas.back.realHeightCm = updateData.printableAreas.back.height/10

//     console.log('updateVariant:', updateData);
    

//     const updated = await StudioVariant.findByIdAndUpdate(variantId, updateData, { new: true });
//     if (!updated) throw new NotFoundError("Studio variant not found");

//     sendSuccess(res, "Studio variant updated successfully", { variant: updated }, 200);
//   } catch (error) {
//     throw error;
//   }
// };

// // FETCH ALL VARIANTS
// const fetchStudioVariants = async (req, res) => {
//   try {
//     const { clothType, clothSubcategory, clothColor } = req.query

//     console.log('query:', req.query)
//     let filter = {}

//     if(clothType) filter.category = clothType
//     if(clothSubcategory) filter.subCategory = clothSubcategory
//     if(clothColor) filter["colors.name"] = clothColor
// console.log('filter:', filter);

//     const variants = await StudioVariant.find(filter);
// console.log('vRIANTS:', variants);

//     sendSuccess(res, "Studio variants fetched successfully", { variants }, 200);
//   } catch (error) {
//     throw error;
//   }
// };

// // DELETE VARIANT
// const deleteStudioVariant = async (req, res) => {
//   try {
//     const variantId = req.params.id;
//     const deleted = await StudioVariant.findByIdAndDelete(variantId);
//     if (!deleted) throw new NotFoundError("Studio variant not found");

//     sendSuccess(res, "Studio variant deleted successfully", { variant: deleted }, 200);
//   } catch (error) {
//     throw error;
//   }
// };

// module.exports = {
//   addStudioVariant,
//   updateStudioVariant,
//   fetchStudioVariants,
//   deleteStudioVariant,
// };












const { NotFoundError } = require("../utils/errors");
const { validateRequest, sendSuccess } = require("./BaseController");
const { createVariantValidation } = require("../utils/validation");
const StudioVariant = require("../models/StudioBaseVariant");

/**
 * WHAT CHANGED & WHY
 *
 * 1. `shirtWidthCm` added to request parsing (parseFloat).
 *    This is the real flat-lay width of the shirt in cm entered by admin.
 *    It makes pixel→cm conversion accurate instead of the old ÷10 guess.
 *
 * 2. computePrintableAreaCm() replaces the four separate `if` blocks.
 *    Old approach:
 *      realWidthCm  = width  / 10   ← wrong (assumes 400px = 40cm for every shirt)
 *      realHeightCm = height / 10
 *    New approach:
 *      pxToCm = shirtWidthCm / 400  ← accurate per shirt type
 *      widthCm  = width  * pxToCm
 *      heightCm = height * pxToCm
 *      offsetFromShirtLeftCm = x * pxToCm  ← NEW: where the print zone starts on cloth
 *      offsetFromShirtTopCm  = y * pxToCm  ← NEW: from collar/top seam down
 *
 * 3. Field renames:
 *      realWidthCm  → widthCm
 *      realHeightCm → heightCm
 */

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