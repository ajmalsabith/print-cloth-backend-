const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: String,
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: Number,
        basePrice: Number,
        finalUnitPrice: Number,
        itemTotal: Number,
        color: String,
        size: String
      },
    ],
    shippingFee: Number,
    subTotal: Number,
    codFee: Number,
    totalDiscount: Number,
    totalAmount: Number,

    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay"],
    },

    paymentInfo: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
    },

    paymentStatus: {
      type: String,
      enum: ["PAID", "PENDING", "FAILED", "REFUND_INITIATED", "REFUNDED"],
    },
    orderStatus: {
      type: String,
      enum: [
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURN_INITIATED",
        "RETURNED",
      ],
      default: "PROCESSING",
    },

    deliveryAddress: {
      fName: String,
      lName: String,
      phone: String,
      streetAddress: String,
      city: String,
      state: String,
      zipcode: String,
      label: String,
    },
    cancelledAt: Date,
    deliveredAt: Date,
    paidAt: Date,
    returnInfo: {
      reason: String,
      note: String,
      date: Date,
    },
  },
  { timestamps: true }
);

orderSchema.index({ "paymentInfo.razorpayPaymentId": 1 });

module.exports = mongoose.model("Order", orderSchema);