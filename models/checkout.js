const { required } = require('joi')
const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const CheckoutSchema = mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sourceType: {
        type: String,
        enum: ['cart', 'buyNow'],
        required: true
    },
    items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false
      },
        variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudioVariant',
        required: false
      },
      productType: {
        type: String,
        default: 'shop',
        enum: ['shop', 'studio'],
        required: true
        },
      quantity: {
        type: Number,
        required: true
      },
      attributes: {
        size: {
        type: String,
        required: true
      },
      color: {
        type: String,
        required: true
      }
      },
       pricingDetails: {
        basePrice: Number,
        totalPrintPrice: Number,
        printCount: Number,
        breakdown: [
          {
            side: String,
            name: String,
            widthCm:  Number,
            heightCm: Number,
            area: Number,
            tier: String,
            price: Number,
          }
        ]
      },
      supplierPrintInstructions: [
  {
    side:            { type: String, enum: ["front", "back"] },
    imageUrl:        String,
    name:            String,
    printTier:       { type: String, enum: ["A5", "A4", "A3"] },
    widthCm:         Number,
    heightCm:        Number,
    fromShirtLeftCm: Number,
    fromShirtTopCm:  Number,
  }
],

      design: {
  prints: [
    {
      imageUrl: String,
      side: {
        type: String,
        enum: ["front", "back"]
      },
      name: String,

      // Raw fabric values
      width: Number,
      height: Number,
      scaleX: Number,
      scaleY: Number,
      
      // Normalized canvas position
      positionX: Number,
      positionY: Number,
      printTier: { type: String, enum: ["A5", "A4", "A3"] }, 

      widthCm: Number,  //for printing purpose in cm
      heightCm: Number,
      offsetFromZoneLeftCm: Number,
      offsetFromZoneTopCm:  Number,

      actualFromShirtLeftCm: Number,
      actualFromShirtTopCm: Number
      
    }
  ],
  previewFront: String,
  previewBack: String
}
      ,
      finalUnitPrice: {
        type: Number,
        required: true
      },
      itemTotal: {
        type: Number,
        required: true
      }
    }
  ],

    
    sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
    
  appliedCoupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null
  },
    totalQuantity: {
        type: Number,
        default: 0
    },
    discountTotal: {
        type: Number,
        default: 0
    },
    //BASE PRICE * QUANTITY
    subTotal: {
        type: Number,
        default: 0
    },
    //SUB TOTAL - TOTAL DISCOUNT
    payableTotal: {
        type: Number,
        default: 0
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod'],
      default: 'razorpay'
    },
    //PAYABLE TOTAL + COD FEE + SHIPPING FEE
    grandTotal: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date
    }
},{timestamps: true})

CheckoutSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
)

module.exports = mongoose.model('Checkout', CheckoutSchema)

