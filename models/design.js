// models/Design.js
const mongoose = require("mongoose");

const DesignSchema = new mongoose.Schema(
  {
    designName: {
      type: String,
      required: true,
      index: true
    },

    imageURL: {
      type: String,
      required: true
    },

    imagePublicId: {
      type: String,
      required: true
    },

    designType: {
      type: String,
      enum: ["AI", "User", "Template"],
      required: true,
      default: 'Template'
    },

    category: {
      type: String,
      required: true,
      index: true
    },

    tags: [
      {
        type: String,
        index: true
      }
    ],

    likes: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["public", "private"],
      default: "public"
    }
  },
  { timestamps: true }
);

// Enable text search
DesignSchema.index({ designName: "text", tags: "text", category: "text" });

module.exports = mongoose.model("Design", DesignSchema);
