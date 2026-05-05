const mongoose = require("mongoose");

const StudioBaseVariantSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["men", "women", "kids"],
    required: true,
  },
 
  subCategory: {
    type: String,
    enum: ["regular", "over-sized", "hoodie", "polo", "crop"],
    required: true,
  },
 
  price: {
    type: Number,
    required: true,
  },
 
  sizes: {
    type: [String],
    default: ["S", "M", "L", "XL"],
    required: true,
  },
 
  // Used to convert canvas pixels → real cm accurately.
  shirtWidthCm: {
    type: Number,
    required: true,
  },
 
  colors: [
    {
      name: String,
      frontImage: String,
      backImage: String,
    },
  ],
 
  printableAreas: {
    front: {
      // Canvas pixel values — used by TShirtCanvas2D for rendering
      x: Number,
      y: Number,
      width: Number,
      height: Number,
 
      // cm values — used by supplier and price calculation
      widthCm: Number,               
      heightCm: Number,              
      offsetFromShirtLeftCm: Number, // print zone start from shirt left edge
      offsetFromShirtTopCm: Number,  // print zone start from shirt collar/top
    },
 
    back: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
 
      widthCm: Number,
      heightCm: Number,
      offsetFromShirtLeftCm: Number,
      offsetFromShirtTopCm: Number,
    },
  },
});
 
StudioBaseVariantSchema.index(
  { category: 1, subCategory: 1, color: 1 },
  { unique: true }
);
 
module.exports = mongoose.model("StudioVariant", StudioBaseVariantSchema);