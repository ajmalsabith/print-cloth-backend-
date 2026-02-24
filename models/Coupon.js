// models/COUPON
const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema(
  {
    couponCode: {
      type: String,
      required: true,
    },

    couponName: {
      type: String,
      required: true,
      index: true,
    },

    description: {
      type: String,
    },

    discountType: {
      type: String,
      required: true,
      default: "percentage",
      enum: ["percentage", "flat"],
    },

    discountValue: {
      type: Number,
      required: true,
    },

    applicableOn: [
      {
        type: String,
      },
    ],

    minimumOrderValue: {
      type: Number,
      default: 499,
    },

    applicableIds: [
      {
        type: String,
      },
    ],

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    usageLimitPerUser: {
      type: Number,
    },

    firstOrderOnly: {
      type: Boolean,
      default: false,
    },

    excludeSaleItems: {
      type: Boolean,
      default: true,
    },

    autoApply: {
      type: Boolean,
      default: false,
    },

    showInFrontend: {
      type: Boolean,
      default: true,
    },

    bannerText: {
      type: String,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Coupon", CouponSchema);
