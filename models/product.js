const { required } = require("joi");
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    description: { type: String },

    //Products selling price
    basePrice: { type: Number, required: true },

    //Product original price before any discount
    originalPrice: { type: Number, default: null},

    sizes: [{ type: String }],

    colors: [{ type: String }],

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    subCategory: {
      type: String,
    },

    targetAudience: {
      type: String,
      enum: ['Adult', 'Kids'],
      required: true
    },

    designTemplates: [{ type: mongoose.Schema.Types.ObjectId,
      ref: "Design",
     }],

    images: {
      front: { type: String },
      back: { type: String }
    },

    imagePublicId: [
      {type: String,
        required: true
      }
    ],

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false},
    isCustomizable: { type: Boolean, default: false},
    isPopular: { type: Boolean, default: false}

  },
  { timestamps: true }
);

//pre save originalPrice to basePrice if not added


module.exports = mongoose.model("Product", ProductSchema);
