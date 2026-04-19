const { NotFoundError, ValidationError } = require("../utils/errors");
const { sendSuccess } = require("../utils/response");

const config = require("../config/config");
const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon")
const Product = require("../models/product")
const Checkout = require("../models/checkout");
const logger = require("../utils/logger");



const validateCoupon = async(code, checkoutTotal, checkoutItems) => {


    try {
      if (!code || !checkoutTotal)
        throw new NotFoundError("Coupon code required", 404);
      
    // code = code?.toUpperCase()

    const coupon = await Coupon.findOne({ couponCode: code.toUpperCase() });

    console.log('coupon:', coupon );
    

    //EXIST CHECK
    if (!coupon) throw new NotFoundError("Invalid coupon code", 404);

    //ACTIVE CHECK
    if (coupon.status !== 'active') throw new ValidationError("Coupon not active", 400);

    //EXPIRY CHECK
    if (coupon.endDate < new Date())
      throw new ValidationError("Coupon expired", 400);

    //USAGE LIMIT CHECK
    // if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    //   throw new ValidationError("Coupon usage limit exceeded", 400);

    //MINIMUM CART VALUE
    if (coupon.minimumOrderValue && checkoutTotal < coupon.minimumOrderValue)
      throw new ValidationError(
        `Minimum cart value ${coupon.minimumOrderValue} required`,
        400
      );
    // if (cartTotal < 100)
    //   throw new ValidationError(`Minimum cart value ${100} required`, 400);

    //category check
    // if (coupon.applicableOn.length) {
    //   const isApplicable = cartItems.some((item) =>
    //     coupon.applicableCategories.includes(item.product.categoryId)
    //   );

    //   if (!isApplicable)
    //     throw new ValidationError(
    //       "Coupon not applicable to selected items",
    //       400
    //     );
    // }

    //calculate discount

    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = Math.floor((checkoutTotal * coupon.discountValue) / 100);
    } else {
      discount = coupon.discountValue;
    }

    // if (coupon.maxDiscountAmount) {
    //   discount = Math.round(Math.min(discount, coupon.maxDiscountAmount));
    // }

    const payableTotal = Math.round(Math.max(checkoutTotal - discount, 0));


    return {
      valid: true,
      discount,
      payableTotal,
      appliedCoupon: coupon._id
    };
    } catch (error) {
      throw error
    }
  }

  const calculateShippingFee = (payableTotal) => {
    console.log('pay total', payableTotal);
    
    return payableTotal > config.FREE_SHIPPING_THRESHOLD ? 0 : config.DELIVERY_FEE
  }

  const calculatePayableTotal = (subTotal, discountTotal) => {
    console.log('subTotal:', subTotal);
    
    return Math.max(0, subTotal - discountTotal || subTotal);
  };

  const calculateSubTotal = (items) => {
    const subTotal = items.reduce(
      (sum, item) => sum + item.finalUnitPrice * item.quantity,
      0
    );

    return subTotal;
  }

  const calculateGrandTotal = (payableTotal, paymentMethod) => {
    console.log('payable:', payableTotal);
    
    const deliveryFee =
      payableTotal > config.FREE_SHIPPING_THRESHOLD ? 0 : config.DELIVERY_FEE;
    const codFee = paymentMethod === "cod" ? config.COD_FEE : 0;

    return payableTotal + deliveryFee + codFee;
  }

function getExpiryTime() {
  return new Date(Date.now() + config.CHECKOUT_TTL_MINUTES * 60 * 1000)
}

const fetchCheckout = async(req, res, next) => {
  try {
    const { mode='cart', buyNowItems=[], paymentMethod='razorpay' } = req.body

  const userId = req.user._id
  let items = []
  let cartId

  if (mode === 'cart') {
    const cartData = await Cart.findOne({user: userId})
    if (!cartData || cartData.items.length === 0 ) throw new NotFoundError('Cart is empty')
      
    items = cartData.items
    cartId = cartData._id
  }
  
  
 if (mode === 'buyNow') {
  console.log('in buy now');
  
  if (!buyNowItems) {
    throw new NotFoundError('Buy now items required');
  }

  const foundProduct = await Product.findById(buyNowItems.product);

  if (!foundProduct) {
    throw new NotFoundError('Product not found');
  }

  const finalUnitPrice = foundProduct.basePrice;
  const itemTotal = finalUnitPrice * buyNowItems.quantity;

  console.log('buy now ', buyNowItems);
  
  items = [{
    ...buyNowItems,
    finalUnitPrice,
    itemTotal
  }];
  
}
  console.log(' checkout items:', items);

  const totalQuantity = items.reduce((acc, item) => {
    return acc+item.quantity
  }, 0)

  let checkout = await Checkout.findOne({
    user: userId,
  })?.populate('appliedCoupon')
  
    const subTotal = calculateSubTotal(items)
  const payableTotal = calculatePayableTotal(subTotal, checkout?.discountTotal)
  const grandTotal = calculateGrandTotal(payableTotal, paymentMethod)

  if (!checkout) {
    checkout = await Checkout.create({
      user: userId,
      sourceType: mode,
      sourceId: mode === 'cart' ? cartId : items[0].product,
      items,
      subTotal,
      payableTotal: subTotal,
      grandTotal,
      totalQuantity,
      paymentMethod,
      expiresAt: getExpiryTime(),
    })
  } else {
    // refresh session
    checkout.items = items
    checkout.subTotal = subTotal
    checkout.totalQuantity = totalQuantity
    checkout.payableTotal = payableTotal
    checkout.grandTotal = grandTotal
    checkout.expiresAt = getExpiryTime()
    await checkout.save()
  }

  const shippingFee = calculateShippingFee(checkout.payableTotal)
  console.log('shioping fee:', shippingFee);
  

  sendSuccess(res, 'Checkout fetched successfully', {
    checkoutId: checkout._id,
    items: checkout.items,
    subTotal: checkout.subTotal,
    appliedCoupon: checkout.appliedCoupon?.couponCode || null,
    discountTotal: checkout.discountTotal,
    payableTotal: checkout.payableTotal,
    shippingFee,
    totalQuantity,
    grandTotal,
    codFee: paymentMethod === 'razorpay' ? 0 : config.COD_FEE
  }, 200)
  } catch (error) {
    next(error)
  }

}

const applyCoupon = async(req, res, next) => {
  
  try {
    const {couponCode} = req.body
  const { checkoutId } = req.params
  console.log('copon code:', req.body, checkoutId);
    const checkout = await Checkout.findById(checkoutId)

     if (!checkout || checkout.expiresAt < new Date()) {
  throw ErrorFactory.generic(
  "Checkout session expired",
  400,
  "CHECKOUT_EXPIRED" 
);
}
    console.log('checkout:',checkout);
    
    
    const validateResponse = await validateCoupon(couponCode, checkout.subTotal, checkout.items )
    console.log('val res:',validateResponse);
    checkout.appliedCoupon = validateResponse.appliedCoupon
    checkout.payableTotal = validateResponse.payableTotal
    checkout.discountTotal = validateResponse.discount
    
    
    const grandTotal = calculateGrandTotal(validateResponse.payableTotal, checkout.paymentMethod)
    checkout.grandTotal = grandTotal
    await checkout.save()

    console.log('checkout after coupon:', checkout);
    

    sendSuccess(res, 'Coupon applied', {
    discountTotal: checkout.discountTotal,
    payableTotal: checkout.payableTotal,
    appliedCoupon: couponCode,
    shippingFee: calculateShippingFee(checkout.payableTotal),
    grandTotal
    })
  } catch (error) {
    next (error)
  }
}

const removeCoupon = async(req, res) => {
    const { checkoutId } = req.params

    const checkout = await Checkout.findById(checkoutId)

      if (!checkout || checkout.expiresAt < new Date()) {
  throw new ValidationError("Checkout session expired")
}

const grandTotal = calculateGrandTotal(checkout.subTotal, checkout.paymentMethod)

checkout.appliedCoupon = null
checkout.payableTotal = checkout.subTotal
checkout.discountTotal = 0
checkout.grandTotal = grandTotal
checkout.save()

 sendSuccess(res, 'Coupon removed', {
    discountTotal: checkout.discountTotal,
    payableTotal: checkout.payableTotal,
    grandTotal: checkout.grandTotal,
    shippingFee: calculateShippingFee(checkout.payableTotal),
    appliedCoupon: null
    }, 200)

}

const selectPaymentMethod = async(req, res, next) => {
  try {
    const { checkoutId } = req.params
    const { paymentMethod } = req.body

    console.log('payment Method:', paymentMethod);
    
    const checkout = await Checkout.findById(checkoutId)

    checkout.paymentMethod = paymentMethod
    checkout.grandTotal = calculateGrandTotal(checkout.payableTotal, paymentMethod)

    await checkout.save()

     sendSuccess(res, 'Payment method changed', {
    grandTotal: checkout.grandTotal,
    paymentMethod: checkout.paymentMethod,
    codFee: paymentMethod === 'razorpay' ? 0 : config.COD_FEE,
    shippingFee: calculateShippingFee(checkout.payableTotal)
    }, 200)

  } catch (error) {
    next(error)
  }
}

module.exports = {
    applyCoupon,
    removeCoupon,
    fetchCheckout,
    selectPaymentMethod,
    calculateGrandTotal,
    calculatePayableTotal,
    calculateSubTotal,
    validateCoupon,
    calculateShippingFee
}