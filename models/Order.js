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
          required: false,
        },
        productType: {
  type: String,
  enum: ["shop", "studio"],
  required: true
},
    title: String,
image: String,
design: {
  prints: [
    {
      imageUrl: String,
      width: Number,
      height: Number,
      left: Number,
      top: Number,
      scaleX: Number,
      scaleY: Number,
      positionX: Number,
      positionY: Number,
      side: String,
      name: String
    }
  ],
  previewFront: String,
  previewBack: String
},
pricingDetails: {
  breakdown: [
    {
      side: String,
      tier: String, // A4, A3 etc
      price: Number,
      name: String
    }
  ],
  totalPrintPrice: Number
},
          variant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'StudioVariant',
          required: false
        },
        quantity: { type: Number, required: true },
        finalUnitPrice: { type: Number, required: true },
        itemTotal: { type: Number, required: true },
        attributes: {
          color: {
            type: String,
            required: true
          },
          size: {
            type: String,
            required: true
          }
        }
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

orderSchema.index({ createdAt: 1, orderStatus: 1, paymentStatus: 1 });

orderSchema.index({ "items.product": 1 });

module.exports = mongoose.model("Order", orderSchema);