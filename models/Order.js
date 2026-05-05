const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: String,

    items: [
      {
        product:     { type: mongoose.Schema.Types.ObjectId, ref: "Product",       required: false },
        variant:     { type: mongoose.Schema.Types.ObjectId, ref: "StudioVariant", required: false },
        productType: { type: String, enum: ["shop", "studio"], required: true },
        title:       String,
        image:       String,

        // Customer-facing — previews only, no canvas data needed post-order
        design: {
  prints: [
    {
      imageUrl: String,
      side: String,
      name: String,

      width: Number,
      height: Number,
      scaleX: Number,
      scaleY: Number,

      widthCm: Number,  //for printing purpose in cm
      heightCm: Number,
      printTier: { type: String, enum: ["A5", "A4", "A3"] }, 

      offsetFromZoneLeftCm: Number,
      offsetFromZoneTopCm:  Number,

      actualFromShirtLeftCm: Number,
      actualFromShirtTopCm: Number,

      positionX: Number,
      positionY: Number,
    }
  ],
  previewFront: String,
  previewBack: String
},

        // Supplier-facing — self-contained, ready to print without any lookups
        supplierPrintInstructions: [
          {
            side:            { type: String, enum: ["front", "back"] },
            imageUrl:        String,
            name:            String,
            printTier:       { type: String, enum: ["A5", "A4", "A3"] },
            widthCm:         Number,
            heightCm:        Number,
            fromShirtLeftCm: Number, // zone offset + print offset — final position on cloth
            fromShirtTopCm:  Number,
          },
        ],

        // Pricing — breakdown only needs enough to explain the charge
        pricingDetails: {
          basePrice:       Number,
          totalPrintPrice: Number,
          breakdown: [
            {
              side:      String,
              name:      String,
              printTier: String,  // A3/A4/A5
              area:      Number,  // cm² — used for tier classification
              price:     Number,
            },
          ],
        },

        quantity:       { type: Number, required: true },
        finalUnitPrice: { type: Number, required: true },
        itemTotal:      { type: Number, required: true },

        attributes: {
          color: { type: String, required: true },
          size:  { type: String, required: true },
        },
      },
    ],

    shippingFee:   Number,
    subTotal:      Number,
    codFee:        Number,
    totalDiscount: Number,
    totalAmount:   Number,

    paymentMethod: { type: String, enum: ["cod", "razorpay"] },

    paymentInfo: {
      razorpayOrderId:   String,
      razorpayPaymentId: String,
      razorpaySignature: String,
    },

    paymentStatus: {
      type: String,
      enum: ["PAID", "PENDING", "FAILED", "REFUND_INITIATED", "REFUNDED"],
    },

    orderStatus: {
      type: String,
      enum: ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURN_INITIATED", "RETURNED"],
      default: "PROCESSING",
    },

    deliveryAddress: {
      fName: String, lName: String, phone: String,
      streetAddress: String, city: String, state: String,
      zipcode: String, label: String,
    },

    cancelledAt: Date,
    deliveredAt: Date,
    paidAt:      Date,

    returnInfo: { reason: String, note: String, date: Date },
  },
  { timestamps: true }
);

orderSchema.index({ "paymentInfo.razorpayPaymentId": 1 });
orderSchema.index({ createdAt: 1, orderStatus: 1, paymentStatus: 1 });
orderSchema.index({ "items.product": 1 });

module.exports = mongoose.model("Order", orderSchema);