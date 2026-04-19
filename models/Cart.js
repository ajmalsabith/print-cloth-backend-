const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const CartSchema = mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    guestId: {
        type: String
    },
    
    items: [{
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
      widthCm: Number,  //for printing purpose in cm
      heightCm: Number,
      side: {
        type: String,
        enum: ["front", "back"]
      },
      name: String
    }
  ],
  previewFront: String,
  previewBack: String
},

          pricingDetails: {
        basePrice: Number,
        totalPrintPrice: Number,
        printCount: Number,
        breakdown: [
          {
            side: String,
            area: Number,
            tier: String,
            price: Number,
            name: String
          }
        ]
      },

      designHash: String,
      image: String,
      attributes: {
            color: {type: String, required: true},
            size: {type: String, required: true}
          },
        productType: {
        type: String,
        default: 'shop',
        enum: ['shop', 'studio'],
        required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        color: {
            type: String
        },
        size: {
            type: String
        },
        //selling price when its added to cart-used to calculate subTotal
        basePrice: {
            type: Number,
            required: true
        },
        //ACTUAL PRICE after discounts NOW
        finalUnitPrice: {
            type: Number,
            required: true
        },
        //FINAL UNIT PRICE * QUANTITY
        itemTotal: {
            type: Number,
            required: true  
        },
    }],
    totalQuantity: {
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
    }
},{timestamps: true})

CartSchema.index({ user: 1 });
CartSchema.index({ guestId: 1 });

module.exports = mongoose.model('Cart', CartSchema)
