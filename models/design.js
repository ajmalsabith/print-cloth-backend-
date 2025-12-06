// models/Design.js
const mongoose = require("mongoose");

const DesignSchema = new mongoose.Schema(
  {
    designName: {
      type: String,
      required: true,
      index: true
    },

    creatorName: {
      type: String,
      default: 'Admin',
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
    enum: ["active", "inactive", "pending", "rejected"],
    default: "pending"
  },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public"
    }
  },
  { timestamps: true }
);

// Enable text search
DesignSchema.index({ designName: "text", creatorName: "text" , tags: "text", category: "text" });

module.exports = mongoose.model("Design", DesignSchema);
