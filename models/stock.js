// models/Stock.js
const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    color: { type: String, required: true },

    size: { type: String, required: true },

    qty: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stock", StockSchema);
