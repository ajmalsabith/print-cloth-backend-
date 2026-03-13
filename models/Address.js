const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const AddressSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    label: {
      type: String,
    },
    fullName: {
      type: String,
    },
    phoneNumber: {
      type: Number,
    },
    addressLine1: {
      type: String,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    postalCode: {
      type: String,
    },
    country: {
      type: String,
    },
    isDefaultShipping: {
      type: Boolean,
    },
    isDefaultBilling: {
      type: Boolean,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Address", AddressSchema);
