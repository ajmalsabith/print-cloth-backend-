// models/Stock.js
const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    subCategory: {
      type: String,
    },

    color: { type: String, required: true },

    size: { type: String, required: true },

    qty: { type: Number, required: true },

    status: {
      type: [String],
      default: 'active'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stock", StockSchema);
