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
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      size: {
        type: String,
        required: true
      },
      color: {
        type: String,
        required: true
      },
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

