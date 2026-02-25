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
        .populate("items.product")
        .populate("appliedCoupon");
      if (!checkoutDoc || checkoutDoc.items.length === 0) {
        throw new NotFoundError("No items in checkout");
      }
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

      console.log('order address:', orderAddress);
      

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
        totalDiscount: discountTotal,
        codFee: checkout.paymentMethod === 'cod' ? config.COD_FEE : 0,
        shippingFee: calculateShippingFee(payableTotal),
        paymentMethod: checkoutDoc.paymentMethod,
        paymentStatus:
          checkoutDoc.paymentMethod === "wallet"
            ? config.PAYMENT_STATUS.PAID
            : config.PAYMENT_STATUS.PENDING,
        deliveryAddress: orderAddress,
      });

      /* ---------------- CLEAR CART ---------------- */
      if (checkoutDoc.sourceType === "cart") {
        const cartDoc = await Cart.findById(checkoutDoc.sourceId)
        cartDoc.items = [];
        cartDoc.appliedCoupon = null;
        await cartDoc.save();
      }

      sendSuccess(res, 'Order placed successfully', {orderId: order._id}, 201)

    } catch (error) {
      console.error("create order error:", error);
      throw error;
    }
  }
  })

  module.exports = {
    createOrder
  }