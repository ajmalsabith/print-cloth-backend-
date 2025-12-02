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

    designTemplates: [{ type: String }],

    images: {
      front: { type: String },
      back: { type: String }
    },

    stock: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stock"
      }
    ],

    isActive: { type: Boolean, default: true }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
