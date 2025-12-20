const { required } = require("joi");
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    description: { type: String },

    basePrice: { type: Number, required: true },

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

    // stock: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Stock"
    //   }
    // ],

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false}

  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
