const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    subcategory: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
