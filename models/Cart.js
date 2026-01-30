const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const CartSchema = mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
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


module.exports = mongoose.model('Cart', CartSchema)
