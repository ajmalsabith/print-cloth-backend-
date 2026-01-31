const { FREE_SHIPPING_THRESHOLD, DELIVERY_FEE } = require("../config/config");
const Cart = require("../models/Cart");
const Product = require("../models/product");
const User = require("../models/User");
const { NotFoundError, ValidationError } = require("../utils/errors");
const { sendSuccess } = require("./BaseController");

//FETCH CART ITEMS
  async function fetchCart (req, res) {
    try {

      const userId = req.user._id.toString();
console.log('in fetch cart server');

      const cart = await Cart.findOne({ user: userId }).populate(
        "items.product")
console.log('fetcged', cart);

      sendSuccess(res, 'Cart fetch successful', {cart}, 200)
    } catch (error) {
      throw error;
    }
  }

  //CALCULATE CART TOTAL QUANTITY
  const recalculateTotalQuantity = (cart) => {
    return cart.items.reduce((acc, item) => acc + item.quantity, 0);
  };

  //CALCULATE CART SUBTOTAL-BEFORE DISCOUNT
  const recalculateSubTotal = (cart) => {
    return cart.items.reduce(
      (acc, item) => acc + item.quantity * item.basePrice,
      0
    );
  };

  // //CALCULATE SHIPPING FEES
  // static calculateShippingFee = (cart) => {
  //   const estimatedShippingFee = cart.payableTotal > FREE_SHIPPING_THRESHOLD ? DELIVERY_FEE : 0
  // }

  //CALCULATE GRAND TOTAL-AFTER DISCOUNT
  const recalculatePayableTotal = (cart) => {
    return cart.items.reduce((acc, item) => acc + item.itemTotal, 0);
  }

//   const revalidateAppliedCoupon = async (cart, warnings = []) => {
//     if (!cart.appliedCoupon) {
//       cart.discountTotal = 0;
//       cart.payableTotal = cart.subTotal;
//       return;
//     }

//     if (cart.appliedCoupon) {
//       try {
//         const { discount, finalAmount, coupon } = await CouponService.validateCoupon(
//           cart.appliedCoupon.code,
//           cart.subTotal,
//           cart.items
//         );
//         cart.discountTotal = discount;

//         cart.appliedCoupon = coupon
        
//         cart.payableTotal = finalAmount;
//       } catch (error) {
//         //invalid coupon
//         cart.appliedCoupon = null;
//         cart.discountTotal = 0;
//         cart.payableTotal = cart.subTotal;
//         warnings.push({ message: "Coupon removed: " + error.message });
//       }
//     }
//   };

  //ADD PRODUCT TO CART
  const addToCart = async(req, res) => {

    const { productId, quantity=1, color, size } = req.body
    console.log('product details:', req.body)
    
    const userId = req.user._id
    const warnings = []
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError("Product not found", 404);
      }

      const basePrice = product.basePrice;
      const finalUnitPrice = basePrice; // discount later here ,
      const itemTotal = finalUnitPrice * quantity;

      //find correct user cart
      let cart = await Cart.findOne({ user: userId })
console.log('cart', cart);


      //if no cart -> create one
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [
            {
              product: productId,
              quantity,
              size,
              color,
              basePrice,
              finalUnitPrice,
              itemTotal,
            },
          ],
        });
      }
      //if cart exist-> check if product exist
      else {
        const itemIndex = cart.items.findIndex(
          (item) => item.product.toString() === productId
        );
        const matchingColor = cart.items[itemIndex]?.color === color
        const matchingSize = cart.items[itemIndex]?.size === size
console.log('matching color:', cart.items[itemIndex]?.color, color);
console.log('matching color:', cart.items[itemIndex]?.size, size);

        //product exist in cart-> update quantity + itemTotal
        if (itemIndex > -1 && matchingColor && matchingSize) {
          cart.items[itemIndex].quantity += quantity;
          cart.items[itemIndex].itemTotal =
            cart.items[itemIndex].quantity *
            cart.items[itemIndex].finalUnitPrice;
        }

        //else new product
        else {
          cart.items.push({
            product: productId,
            quantity,
            color,
            size,
            basePrice,
            finalUnitPrice,
            itemTotal,
          });
        }
      }

      //recalculate total basePrice and quantity
      cart.totalQuantity = recalculateTotalQuantity(cart);
      cart.subTotal = recalculateSubTotal(cart);

    // //   await this.revalidateAppliedCoupon(cart, warnings);

      await cart.save();

    //   // await cart.populate("items.product").populate( "appliedCoupon")
      cart = await cart.populate('items.product')

      sendSuccess(res, 'Product added to cart', {cart}, 200)
    } catch (error) {
      throw error;
    }
  }

  //REMOVE FROM CART
  const removeFromCart = async(req, res) => {
    try {
        const warnings = []
        const userId = req.user._id
        const { _id, color, size } = req.body
        console.log();
        
      const cart = await Cart.findOneAndUpdate(
        { user: userId },
        { $pull: { items: { _id, color, size } } },
        {
          new: true,
        }
      ).populate("items.product")

      if (!cart) {
        throw new NotFoundError("Product not found", 404);
      }

      cart.totalQuantity = recalculateTotalQuantity(cart);
      cart.subTotal = recalculateSubTotal(cart);

    //   await this.revalidateAppliedCoupon(cart, warnings);

      await cart.save();
      sendSuccess(res, 'Product removed from cart', {cart}, 200)
    } catch (error) {
      throw error;
    }
  }

  //SYNC CART -> ADD/DECREASE QUANTITY
  const syncCart = async(req, res) => {
    const userId = req.user._id
    const items = req.body
    
    try {
      if (!Array.isArray(items)) {
        throw new ValidationError("Invalid cart data", 400);
      }

      const productIds = items.map((i) => i.productId);

      const products = await Product.find({
        _id: { $in: productIds },
      });

      //products from DB stored in Map object for minimal queries,
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      const warnings = [];
      const cartItems = items
        .map((i) => {
          const product = productMap.get(i.productId);

          if (!product) return null;

        //   if (i.color !== product.color || i.size !== product.size) return null
          
//check stock
const requestedQuantity = Math.max(0, i.quantity);
console.log('reqstd', requestedQuantity);
          if (requestedQuantity === 0) return null
        //   const allowedQuantity = Math.min(requestedQuantity, product.stock);

        //   //if no stock
        //   if (allowedQuantity === 0) {
        //     warnings.push({
        //       productId: product._id,
        //       message: `${product.name} is out of stock`,
        //     });
        //     return null;
        //   }

        //   //if low stock
        //   if (allowedQuantity < requestedQuantity) {
        //     warnings.push({
        //       productId: product._id,
        //       message: `Only ${allowedQuantity} items available for ${product.name}`,
        //     });
        //   }

          const basePrice = product.basePrice;
          const finalUnitPrice = basePrice; //after discount later
          const itemTotal = finalUnitPrice * requestedQuantity;

          return {
            product: product._id,
            quantity: requestedQuantity,
            color: i.color,
            size: i.size,
            basePrice,
            finalUnitPrice,
            itemTotal,
          }
        })
        .filter(Boolean)

      const cart = await Cart.findOne({ user: userId })

      if (!cart) throw new NotFoundError("Cart not found");

      cart.items = cartItems;

      //recalculate totals
      cart.totalQuantity = recalculateTotalQuantity(cart);
      cart.subTotal = recalculateSubTotal(cart);

    //   await this.revalidateAppliedCoupon(cart, warnings);

      await cart.save();

      // await cart.populate("items.product").populate( "appliedCoupon")

      sendSuccess(res, 'Product quantity updated', {cart}, 200)
    } catch (error) {
      throw error;
    }
  }

  //CHANGE CART ITEM SIZE
  const updateSize = async (req, res) => {
  try {
    const { itemId, productId, size, color } = req.body;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Find item being updated
    console.log('car items::', cart.items);
    
    const itemIndex = cart.items.findIndex(
      (i) => i._id.toString() === itemId
    );

    if (itemIndex === -1)
      return res.status(404).json({ message: "Item not found" });

    const item = cart.items[itemIndex];

    // Check if variant already exists
    const existingIndex = cart.items.findIndex(
      (i) =>
        i.product.toString() === productId &&
        i.color === color &&
        i.size === size
    );

    //if product variant already exist
    if (existingIndex !== -1) {
      // Merge quantities
      cart.items[existingIndex].quantity += item.quantity;

      // Remove old item
      cart.items.splice(itemIndex, 1);

      //if product variant doesnt exist
    } else {
      // ✏️ Just update size
      cart.items[itemIndex].size = size;
    }

    await cart.save();

    await cart.populate("items.product");

    sendSuccess(res, 'Item size updated', {cart}, 200)

  } catch (err) {
    console.error("Update size error:", err);
    throw err
  }
};

//   //APPLY COUPON EXPLICITLY
//   const applyCoupon = async (userId, code) => {
//     const cart = await Cart.findOne({user: userId}).populate('items.product').populate( "appliedCoupon")

//     if (!cart) throw new NotFoundError('Cart not found')
    
//     const result = await CouponService.validateCoupon(
//         code,
//         cart.subTotal,
//         cart.items
//     )
    
//     cart.appliedCoupon = result.coupon

//     cart.discountTotal = Math.round(result.discount)
//     cart.payableTotal = Math.round(result.finalAmount)


    
    
//     await cart.save()
//     await cart.populate('appliedCoupon')
//     return {cart}
//   }

//   const removeCoupon = async (userId) => {
//     const cart = await Cart.findOne({user: userId})
//     if (!cart) throw new NotFoundError('Cart not found')
    
//     cart.appliedCoupon = null
//     cart.discountTotal = 0
//     cart.payableTotal = cart.subTotal
    
//     await cart.save()
    
//     return {cart}
//   }

module.exports = {
    fetchCart,
    addToCart,
    syncCart,
    removeFromCart,
    updateSize
};
