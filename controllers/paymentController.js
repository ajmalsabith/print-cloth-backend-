const config = require("../config/config");
const Cart = require("../models/Cart");
const checkout = require("../models/checkout");
const Order = require("../models/Order");
const User = require("../models/User");
const { ValidationError, NotFoundError } = require("../utils/errors");
const { asyncHandler, sendSuccess } = require("./BaseController");
const { calculateSubTotal, validateCoupon, calculatePayableTotal, calculateGrandTotal, calculateShippingFee } = require("./checkoutController");

//CREATE ORDER COD/WALLET
  const createOrder = asyncHandler(async(req, res) => {
    {
    try {
      const {
        checkoutId,
        deliveryAddress,
      } = req.body;
      const userId = req.user._id

      let items = [];
      let appliedCoupon = null;
      let checkoutDoc = null;

      /* ---------------- RESOLVE ITEMS ---------------- */
      checkoutDoc = await checkout.findById(checkoutId)
        .populate(["items.product", "items.variant", "appliedCoupon"])
        console.log('checkout id:', checkoutId)
        console.log('checkout doc:', checkoutDoc)
      if (!checkoutDoc || checkoutDoc.items.length === 0) {
        throw new NotFoundError("No items in checkout");
      }
      console.log('checkout doc::', checkoutDoc)
      items = checkoutDoc.items;
      appliedCoupon = checkoutDoc.appliedCoupon;


      const subTotal = calculateSubTotal(items, appliedCoupon);

      let discountTotal = 0;
      // let payableTotal
      /* ---------------- COUPON VALIDATION ---------------- */
      if (appliedCoupon?.couponCode) {
        const result = await validateCoupon(
          appliedCoupon.couponCode,
          subTotal,
          items
        );
        discountTotal = result.discount;
      }

      /* ---------------- CALCULATE TOTALS ---------------- */

      const payableTotal = calculatePayableTotal(subTotal, discountTotal);

      const grandTotal = calculateGrandTotal(payableTotal, checkoutDoc.paymentMethod);

      console.log('payableTotal:', payableTotal);
      console.log('grandTotal:', grandTotal);
      
      /* ---------------- ADDRESS ---------------- */
      const orderAddress = {
        fName: deliveryAddress.fName,
        lName: deliveryAddress.lName,
        phone: deliveryAddress.phone,
        streetAddress: deliveryAddress.streetAddress,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zipcode: deliveryAddress.zipcode,
        label: deliveryAddress.label,
      };

      console.log('checkoutDoc:', checkoutDoc);
      

      /* ---------------- WALLET ---------------- */
    //   if (paymentMethod === "Wallet") {
    //     const user = await User.findById(userId);
    //     if (!user) throw new NotFoundError("User not found");
    //     if (user.wallet.balance < grandTotal) {
    //       throw new ValidationError("Insufficient wallet balance");
    //     }
    //     user.wallet.balance -= grandTotal;
    //     await user.save();
    //   }

      /* ---------------- STOCK ---------------- */
    //   for (const item of items) {
    //     await Product.updateOne(
    //       { _id: item.product._id },
    //       { $inc: { stock: -item.quantity } }
    //     );
    //   }
      /* ---------------- ORDER ID ---------------- */
      const idFormat = Array.from({ length: 4 }, () =>
        crypto
          .getRandomValues(new Uint16Array(1))[0]
          .toString(16)
          .padStart(4, "0")
      ).join("-");

      /* ---------------- CREATE ORDER ---------------- */
      const order = await Order.create({
        orderId: `ORDER-${idFormat}`,
        user: userId,
        items,
        totalAmount: grandTotal,
        subTotal,
        totalDiscount: discountTotal,
        codFee: checkoutDoc.paymentMethod === 'cod' ? config.COD_FEE : 0,
        shippingFee: calculateShippingFee(payableTotal),
        paymentMethod: checkoutDoc.paymentMethod,
        paymentStatus: config.PAYMENT_STATUS.PENDING,
        deliveryAddress: orderAddress,
      });

      /* ---------------- CLEAR CART ---------------- */
      if (checkoutDoc.sourceType === "cart") {
        const cartDoc = await Cart.findById(checkoutDoc.sourceId)
        
        cartDoc.items = [];
        console.log('cart doc in order:', cartDoc);
        await cartDoc.save();
      }

      await checkout.findByIdAndDelete(checkoutId)

      sendSuccess(res, 'Order placed successfully', {orderId: order._id}, 201)

    } catch (error) {
      console.error("create order error:", error);
      throw error;
    }
  }
  })

  //CREATE RAZORPAY ORDER
const createRazorpayOrder = asyncHandler(async (req, res) => {
  try {
    const { checkoutId } = req.body;
    const userId = req.user._id;

    let items = [];
    let appliedCoupon = null;
    let checkoutDoc = null;

    /* ---------------- RESOLVE ITEMS ---------------- */
    checkoutDoc = await checkout.findById(checkoutId)
      .populate(["items.product", "items.variant", "appliedCoupon"]);

    if (!checkoutDoc || checkoutDoc.items.length === 0) {
      throw new NotFoundError("No items in checkout");
    }

    items = checkoutDoc.items;
    appliedCoupon = checkoutDoc.appliedCoupon;

    /* ---------------- CALCULATE TOTALS ---------------- */
    const subTotal = calculateSubTotal(items, appliedCoupon);

    let discountTotal = 0;

    /* ---------------- COUPON VALIDATION ---------------- */
    if (appliedCoupon?.couponCode) {
      const result = await validateCoupon(
        appliedCoupon.couponCode,
        subTotal,
        items
      );
      discountTotal = result.discount;
    }

    const payableTotal = calculatePayableTotal(subTotal, discountTotal);

    const grandTotal = calculateGrandTotal(
      payableTotal,
      checkoutDoc.paymentMethod
    );

    /* ---------------- CREATE RAZORPAY ORDER ---------------- */
    const razorpayOrder = await razorpay.orders.create({
      amount: grandTotal * 100, // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    /* ---------------- RESPONSE ---------------- */
    sendSuccess(res, "Razorpay order created", {
      razorpayOrderId: razorpayOrder.id,
      amount: grandTotal,
      currency: "INR",
      checkoutId, // important for verification step
    });

  } catch (error) {
    console.error("create razorpay order error:", error);
    throw error;
  }
});

// RAZORPAY VERIFICATION AFTER PAYMENT
const verifyRazorpayOrder = async(userId, data) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      checkoutId,
      deliveryAddress,
    } = data;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new NotFoundError("Missing Razorpay details");
    }

    /* ---------------- VERIFY SIGNATURE ---------------- */
    const expectedSignature = crypto
      .createHmac("sha256", config.RAZORPAY.SECRET_KEY)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ValidationError("Payment verification failed");
    }

    /* ---------------- FETCH CHECKOUT ---------------- */
    const checkoutDoc = await checkout.findById(checkoutId)
      .populate(["items.product", "items.variant", "appliedCoupon"]);

    if (!checkoutDoc || checkoutDoc.items.length === 0) {
      throw new NotFoundError("No items in checkout");
    }

    const items = checkoutDoc.items;
    const appliedCoupon = checkoutDoc.appliedCoupon;

    /* ---------------- CALCULATE TOTALS ---------------- */
    const subTotal = calculateSubTotal(items, appliedCoupon);

    let discountTotal = 0;

    if (appliedCoupon?.couponCode) {
      const result = await validateCoupon(
        appliedCoupon.couponCode,
        subTotal,
        items
      );
      discountTotal = result.discount;
    }

    const payableTotal = calculatePayableTotal(subTotal, discountTotal);

    const grandTotal = calculateGrandTotal(
      payableTotal,
      checkoutDoc.paymentMethod
    );

    /* ---------------- ADDRESS ---------------- */
    const orderAddress = {
      fName: deliveryAddress.fName,
      lName: deliveryAddress.lName,
      phone: deliveryAddress.phone,
      streetAddress: deliveryAddress.streetAddress,
      city: deliveryAddress.city,
      state: deliveryAddress.state,
      zipcode: deliveryAddress.zipcode,
      label: deliveryAddress.label,
    };

    /* ---------------- STOCK UPDATE ---------------- */
    for (const item of items) {
      await Product.updateOne(
        { _id: item.product._id },
        { $inc: { stock: -item.quantity } }
      );
    }

    /* ---------------- ORDER ID ---------------- */
    const idFormat = Array.from({ length: 4 }, () =>
      crypto
        .getRandomValues(new Uint16Array(1))[0]
        .toString(16)
        .padStart(4, "0")
    ).join("-");

    /* ---------------- CREATE ORDER ---------------- */
    const order = await Order.create({
      orderId: `ORDER-${idFormat}`,
      user: userId,
      items,
      totalAmount: grandTotal,
      subTotal,
      totalDiscount: discountTotal,
      codFee: 0,
      shippingFee: calculateShippingFee(payableTotal),
      paymentMethod: "Razorpay",
      paymentStatus: config.PAYMENT_STATUS.PAID,
      paymentInfo: {
        razorpayOrderId: razorpay_order_id,
        razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      deliveryAddress: orderAddress,
      paidAt: Date.now(),
    });

    /* ---------------- CLEAR CART ---------------- */
    if (checkoutDoc.sourceType === "cart") {
      const cartDoc = await Cart.findById(checkoutDoc.sourceId);
      if (cartDoc) {
        cartDoc.items = [];
        await cartDoc.save();
      }
    }

    /* ---------------- CLEANUP ---------------- */
    await checkout.findByIdAndDelete(checkoutId);

    return {
      success: true,
      orderId: order.orderId,
    };

  } catch (error) {
    logger.error("verify razorpay error:", error.message);
    throw error;
  }
}

  module.exports = {
    createOrder,
    createRazorpayOrder,
    verifyRazorpayOrder
  }