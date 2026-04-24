const { FREE_SHIPPING_THRESHOLD, DELIVERY_FEE } = require("../config/config");
const Cart = require("../models/Cart");
const Product = require("../models/product");
const StudioBaseVariant = require("../models/StudioBaseVariant");
const User = require("../models/User");
const { NotFoundError, ValidationError } = require("../utils/errors");
const logger = require("../utils/logger");
const { sendError } = require("../utils/response");
const { sendSuccess } = require("./BaseController");


//NORMALIZE STUDIO PRODUCT DESIGN DETAILS FOR CART
function normalizeDesign(elements, previewImages) {
  console.log('elements:', elements)
  return {
    prints: elements?.map(p => ({
      imageUrl: p.imageUrl,
      width: p.width,
      height: p.height,
      left: p.left,
      top: p.top,
      scaleX: p.scaleX,
      scaleY: p.scaleY,
      positionX: p.positionX,
      positionY: p.positionY,
      side: p.side,
      name: p.name || "Custom Design"
    })) || [],
    previewFront: previewImages.front || null,
    previewBack: previewImages.back || null
  };
}

//TRANSFORM CART
function transformCart(cart) {
  return {
    _id: cart._id,
    totalQuantity: cart.totalQuantity,
    subTotal: cart.subTotal,
    payableTotal: cart.payableTotal,
    items: cart.items.map((item) => {
      // SHOP PRODUCT
      if (item.productType === "shop") {
        return {
          _id: item._id,
          type: "shop",

          title: item.product?.name,
          image: item.product?.images?.front,
          quantity: item.quantity,
          basePrice: item.basePrice,
          finalUnitPrice: item.finalUnitPrice,
          product: {                          //expose for size editor
      _id: item.product._id,
      sizes: item.product.sizes,
    },
          itemTotal: item.itemTotal,
          attributes: item.attributes
        };
      }

      // STUDIO PRODUCT
      if (item.productType === "studio") {
        return {
          _id: item._id,
          type: "studio",

          title: `${item.variant?.category} ${item.variant?.subCategory}`,
          image:
            item.design?.previewFront ||
            item.variant?.colors?.[0]?.frontImage,

          quantity: item.quantity,
          basePrice: item.basePrice,
          finalUnitPrice: item.finalUnitPrice,
          itemTotal: item.itemTotal,
          attributes: item.attributes,
          variant: {                          // expose for size editor
      _id: item.variant._id,
      sizes: item.variant.sizes,
    },

          designSummary: {
            printCount: item.design?.prints?.length || 0,

            prints: item.pricingDetails?.breakdown?.map((p) => ({
              side: p.side,
              size: p.tier,
              price: p.price,
              name: p.name || "Custom Print"
            })),

            totalPrintPrice: item.pricingDetails?.totalPrintPrice
          }
        };
      }

      return null;
    }).filter(Boolean)
  };
}

//FETCH CART ITEMS
async function fetchCart(req, res) {
  let cart;
  try {
    const userId = req?.user?._id
    const guestId = req.query?.guestId;
    if (userId) {
      cart = await Cart.findOne({ user: userId }).populate(["items.product", "items.variant"]).lean();
    } else if (guestId) {
      cart = await Cart.findOne({ guestId }).populate(
        ["items.product", "items.variant"]
      );
    }
    if (!cart) {
  return sendSuccess(res, "Cart is empty", {
    cart: {
      id: null,
      items: [],
      totalQuantity: 0,
      subTotal: 0,
      payableTotal: 0,
    },
  });
}
console.log('transformed cart:', cart.items)
    const transformedCart = transformCart(cart)
    // console.log('transformed cart:', transformedCart.items)
    sendSuccess(res, "Cart fetch successful", { cart: transformedCart }, 200);
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
    0,
  )
};

// //CALCULATE SHIPPING FEES
// static calculateShippingFee = (cart) => {
//   const estimatedShippingFee = cart.payableTotal > FREE_SHIPPING_THRESHOLD ? DELIVERY_FEE : 0
// }

//CALCULATE GRAND TOTAL-AFTER DISCOUNT
const recalculatePayableTotal = (cart) => {
  return cart.items.reduce((acc, item) => acc + item.itemTotal, 0);
};

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

const PRINT_PRICING = {
  small: { maxArea: 60, price: 30 },
  medium: { maxArea: 100, price: 60 },
  large: { maxArea: Infinity, price: 100 }
}

//STUDIO PRODUCT PRICE CALCULATION
function calculateStudioPrice(variant, prints) {
  let totalPrintPrice = 0

  const front = variant.printableAreas.front
  const back = variant.printableAreas.back

  const pxToCmXFront = front.realWidthCm / front.width
  const pxToCmYFront = front.realHeightCm / front.height

  const pxToCmXBack = back.realWidthCm / back.width
  const pxToCmYBack = back.realHeightCm / back.height

  const breakdown = []

  for (const print of prints) {
    const isFront = print.side === "front"

    const pxToCmX = isFront ? pxToCmXFront : pxToCmXBack
    const pxToCmY = isFront ? pxToCmYFront : pxToCmYBack

    const widthCm = print.width * print.scaleX * pxToCmX
    const heightCm = print.height * print.scaleY * pxToCmY

    const area = widthCm * heightCm

    let tier = "large"
    if (area <= PRINT_PRICING.small.maxArea) tier = "small"
    else if (area <= PRINT_PRICING.medium.maxArea) tier = "medium"

    const price = PRINT_PRICING[tier].price

    totalPrintPrice += price

    breakdown.push({
      side: print.side,
      widthCm,
      heightCm,
      area,
      tier,
      price
    })
  }

  const basePrice = variant.price || 0

  return {
    basePrice,
    totalPrintPrice,
    finalUnitPrice: basePrice + totalPrintPrice,
    breakdown
  }
}

//ADD TO CART
const addToCart = async (req, res) => {
  const { productId, variantId, quantity = 1, color, size, productType = 'shop', elements, previewImages } = req.body;

  const userId = req.user?._id;
  const guestId = req.query?.guestId;
  let cart;
  const warnings = [];
  try {
    let basePrice = 0;
    let finalUnitPrice = 0;
    let pricingDetails = null;

    if(productType === "shop") {
      const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError("Product not found", 404);
    }
    basePrice = product.basePrice;
    finalUnitPrice = basePrice;
    }

    let designData = null;

    if(productType === "studio") {
      const variant = await StudioBaseVariant.findById(variantId)

      designData = normalizeDesign(elements, previewImages);

      if (!variant) throw new NotFoundError("Variant not found", 404);
      const result = calculateStudioPrice(variant, elements);
      
      basePrice = result.basePrice;
      finalUnitPrice = result.finalUnitPrice;
      pricingDetails = result;
      
    }
    const itemTotal = finalUnitPrice * quantity;

    //find correct user cart
    if (userId) {
      cart = await Cart.findOne({ user: userId });
    } else {
      cart = await Cart.findOne({ guestId });
    }

    //if no cart -> create one
    if (!cart) {
      cart = new Cart({
        ...(userId ? { user: userId } : { guestId }),
        items: [
          {
            product: productId || null,
            variant: variantId || null,
            productType,
            quantity,
            attributes: {
              color,
              size
            },
            basePrice,
            finalUnitPrice,
            itemTotal,
            ...(productType === "studio" && {
              design: designData,
              pricingDetails,
              designHash: JSON.stringify(elements)
            }),
          },
        ],
      });
    }
    //if cart exist-> check if product exist
    else {
      // const itemIndex = cart.items.findIndex(
      //   (item) => item.product.toString() === productId,
      // );
      // const matchingColor = cart.items[itemIndex]?.color === color;
      // const matchingSize = cart.items[itemIndex]?.size === size;

      // //product exist in cart-> update quantity + itemTotal
      // if (itemIndex > -1 && matchingColor && matchingSize) {
      //   cart.items[itemIndex].quantity += quantity;
      //   cart.items[itemIndex].itemTotal =
      //     cart.items[itemIndex].quantity * cart.items[itemIndex].finalUnitPrice;
      // }

      const designHash =
  productType === "studio"
    ? JSON.stringify(elements)
    : null;

      const itemIndex = cart.items.findIndex((item) => {
  if (productType === "shop") {
    return (
      item.product?.toString() === productId &&
      item.attributes.color === color &&
      item.attributes.size === size
    );
  }

  if (productType === "studio") {
    return (
      item.variant?.toString() === variantId &&
      item.designHash === designHash
    );
  }

  return false;
});

if (itemIndex > -1) {
  cart.items[itemIndex].quantity += quantity;

  cart.items[itemIndex].itemTotal =
    cart.items[itemIndex].quantity *
    cart.items[itemIndex].finalUnitPrice;
}

      //else new product
      else {
        cart.items.push({
          product: productId || null,
          variant: variantId || null,
          productType,
          quantity,
          attributes: {
              color,
              size
            },
          basePrice,
          finalUnitPrice,
          itemTotal,
                      ...(productType === "studio" && {
              design: designData,
              pricingDetails,
              designHash: JSON.stringify(elements)
            }),
        });
      }
    }

    //recalculate total basePrice and quantity
    cart.totalQuantity = recalculateTotalQuantity(cart);
    cart.subTotal = recalculateSubTotal(cart);
    cart.payableTotal = recalculatePayableTotal(cart);

    // //   await this.revalidateAppliedCoupon(cart, warnings);

    await cart.save();

    //   // await cart.populate("items.product").populate( "appliedCoupon")
    await cart.populate(["items.variant", "items.product"]);

    // console.log('cart variant:', cart.items);
const formattedCart = transformCart(cart);

sendSuccess(res, "Product added to cart", { cart: formattedCart }, 200);

  } catch (error) {
    throw error;
  }
};


//REMOVE FROM CART
const removeFromCart = async (req, res) => {
  try {
    const warnings = [];
    const userId = req.user?._id;
    const guestId = req.query?.guestId;
    const { _id, color, size } = req.body;
    let cart;

    if (userId) {
      cart = await Cart.findOneAndUpdate(
        { user: userId },
        { $pull: { items: { _id } } },
        {
          new: true,
        },
      ).populate(["items.product", "items.variant"]);
    } else {
      cart = await Cart.findOneAndUpdate(
        { guestId },
        { $pull: { items: { _id } } },
        {
          new: true,
        },
      ).populate(["items.product", "items.variant"])
    }

    if (!cart) {
      throw new NotFoundError("Product not found", 404);
    }

    cart.totalQuantity = recalculateTotalQuantity(cart);
    cart.subTotal = recalculateSubTotal(cart);
    cart.payableTotal = recalculatePayableTotal(cart);

    //   await this.revalidateAppliedCoupon(cart, warnings);

    await cart.save();

    cart = transformCart(cart)
    sendSuccess(res, "Product removed from cart", { cart }, 200);
  } catch (error) {
    throw error;
  }
};

//SYNC CART -> ADD/DECREASE QUANTITY
// const syncCart = async (req, res) => {
//   const userId = req.user?._id;
//   const guestId = req.query?.guestId;
//   const items = req.body;
//   let cart;
//   console.log('items in sync:', items)

//   try {
//     if (!Array.isArray(items)) {
//       throw new ValidationError("Invalid cart data", 400);
//     }

//     const productIds = items.map((i) => i.productId);

//     const products = await Product.find({
//       _id: { $in: productIds },
//     });

//     //products from DB stored in Map object for minimal queries,
//     const productMap = new Map(products.map((p) => [p._id.toString(), p]));

//     const warnings = [];
//     const cartItems = items
//       .map((i) => {
//         const product = productMap.get(i.productId);

//         if (!product) return null;

//         //   if (i.color !== product.color || i.size !== product.size) return null

//         //check stock
//         const requestedQuantity = Math.max(0, i.quantity);
//         console.log("reqstd", requestedQuantity);
//         if (requestedQuantity === 0) return null;
//         //   const allowedQuantity = Math.min(requestedQuantity, product.stock);

//         //   //if no stock
//         //   if (allowedQuantity === 0) {
//         //     warnings.push({
//         //       productId: product._id,
//         //       message: `${product.name} is out of stock`,
//         //     });
//         //     return null;
//         //   }

//         //   //if low stock
//         //   if (allowedQuantity < requestedQuantity) {
//         //     warnings.push({
//         //       productId: product._id,
//         //       message: `Only ${allowedQuantity} items available for ${product.name}`,
//         //     });
//         //   }

//         const basePrice = product.basePrice;
//         const finalUnitPrice = basePrice; //after discount later
//         const itemTotal = finalUnitPrice * requestedQuantity;

//         return {
//           product: product._id,
//           quantity: requestedQuantity,
//           color: i.color,
//           size: i.size,
//           basePrice,
//           finalUnitPrice,
//           itemTotal,
//         };
//       })
//       .filter(Boolean);

//     if (userId) {
//       cart = await Cart.findOne({ user: userId });
//     } else {
//       cart = await Cart.findOne({ guestId });
//       console.log("guestId in sync api:", guestId);
//     }
//     if (!cart) throw new NotFoundError("Cart not found");

//     cart.items = cartItems;

//     //recalculate totals
//     cart.totalQuantity = recalculateTotalQuantity(cart);
//     cart.subTotal = recalculateSubTotal(cart);
//     cart.payableTotal = recalculatePayableTotal(cart);

//     //   await this.revalidateAppliedCoupon(cart, warnings);

//     await cart.save();

//     // await cart.populate("items.product").populate( "appliedCoupon")

//     cart = transformCart(cart)
//     sendSuccess(res, "Product quantity updated", { cart }, 200);
//   } catch (error) {
//     throw error;
//   }
// };

//CHANGE CART ITEM SIZE
// const updateSize = async (req, res) => {
//   try {
//     const { itemId, productId, size, color } = req.body;
//     const userId = req.user?._id;
//     const guestId = req.query?.guestId;
//     let cart;

//     if (userId) {
//       cart = await Cart.findOne({ user: userId });
//     } else {
//       cart = await Cart.findOne({ guestId });
//     }
//     if (!cart) return res.status(404).json({ message: "Cart not found" });

//     // Find item being updated
//     const itemIndex = cart.items.findIndex((i) => i._id.toString() === itemId);

//     if (itemIndex === -1)
//       return res.status(404).json({ message: "Item not found" });

//     const item = cart.items[itemIndex];

//     // Check if variant already exists
//     const existingIndex = cart.items.findIndex(
//       (i) =>
//         i.product.toString() === productId &&
//         i.attributes.color === color &&
//         i.attributes.size === size,
//     );

//     //if product variant already exist
//     if (existingIndex !== -1) {
//       // Merge quantities
//       cart.items[existingIndex].quantity += item.quantity;

//       // Remove old item
//       cart.items.splice(itemIndex, 1);

//       //if product variant doesnt exist
//     } else {
//       // Just update size
//       cart.items[itemIndex].attributes.size = size;
//     }

//     await cart.save();

//     await cart.populate(["items.product", "items.variant"]);

//     cart = transformCart(cart)

//     sendSuccess(res, "Item size updated", { cart }, 200);
//   } catch (err) {
//     console.error("Update size error:", err);
//     throw err;
//   }
// };



const syncCart = async (req, res) => {
  const userId = req.user?._id;
  const guestId = req.query?.guestId;
  const items = req.body;

  try {
    if (!Array.isArray(items)) {
      throw new ValidationError("Invalid cart data", 400);
    }

    // ── 1. Split by type ──────────────────────────────────────────
    const shopItems   = items.filter(i => i.type === "shop");
    const studioItems = items.filter(i => i.type === "studio");

    // ── 2. Resolve shop items against DB ─────────────────────────
    const productIds = shopItems.map(i => i.productId);
    const products   = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const resolvedShopItems = shopItems.map(i => {
      const product = productMap.get(i.productId);
      if (!product) return null;

      const quantity = Math.max(1, i.quantity);
      const basePrice     = product.basePrice;
      const finalUnitPrice = basePrice;
      const itemTotal     = finalUnitPrice * quantity;

      return {
        product:      product._id,
        variant:      null,
        productType:  "shop",
        quantity,
        attributes:   { color: i.attributes.color, size: i.attributes.size },
        basePrice,
        finalUnitPrice,
        itemTotal,
      };
    }).filter(Boolean);

    // ── 3. Resolve studio items — trust existing pricing ──────────
    //    We look up the cart item by _id so we keep design/pricingDetails intact.
    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId });
    } else {
      cart = await Cart.findOne({ guestId });
    }
    if (!cart) throw new NotFoundError("Cart not found");

    const resolvedStudioItems = studioItems.map(i => {
      // Find the persisted cart item to preserve design + pricingDetails
      const existing = cart.items.find(ci => ci._id.toString() === i._id);

      if (!existing) return null;

      const quantity  = Math.max(1, i.quantity);
      const itemTotal = existing.finalUnitPrice * quantity;

      return {
        ...existing.toObject(),   // keeps design, pricingDetails, designHash
        quantity,
        itemTotal,
      };
    }).filter(Boolean);

    // ── 4. Merge and save ─────────────────────────────────────────
    cart.items = [...resolvedShopItems, ...resolvedStudioItems];

    cart.totalQuantity = recalculateTotalQuantity(cart);
    cart.subTotal      = recalculateSubTotal(cart);
    cart.payableTotal  = recalculatePayableTotal(cart);

    await cart.save();
    await cart.populate(["items.product", "items.variant"]);

    cart = transformCart(cart);
    sendSuccess(res, "Cart synced", { cart }, 200);

  } catch (error) {
    throw error;
  }
};



const updateSize = async (req, res) => {
  try {
    const { itemId, productId, variantId, size, color } = req.body;
    const userId = req.user?._id;
    const guestId = req.query?.guestId;
    let cart;

    if (userId) {
      cart = await Cart.findOne({ user: userId });
    } else {
      cart = await Cart.findOne({ guestId });
    }
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex((i) => i._id.toString() === itemId);
    if (itemIndex === -1)
      return res.status(404).json({ message: "Item not found" });

    const item = cart.items[itemIndex];
    const isStudio = item.productType === "studio";

    // Find a duplicate item (same variant/product + same color + new size)
    const existingIndex = cart.items.findIndex((i, idx) => {
      if (idx === itemIndex) return false; // skip the item being edited

      if (isStudio) {
        return (
          i.variant?.toString() === (variantId || item.variant?.toString()) &&
          i.attributes.color === color &&
          i.attributes.size === size
        );
      } else {
        return (
          i.product?.toString() === (productId || item.product?.toString()) &&
          i.attributes.color === color &&
          i.attributes.size === size
        );
      }
    });

    if (existingIndex !== -1) {
      // Merge into existing, remove old
      cart.items[existingIndex].quantity += item.quantity;
      cart.items[existingIndex].itemTotal =
        cart.items[existingIndex].quantity *
        cart.items[existingIndex].finalUnitPrice;
      cart.items.splice(itemIndex, 1);
    } else {
      // Just update the size in attributes
      cart.items[itemIndex].attributes.size = size;
      cart.items[itemIndex].itemTotal =
        item.quantity * item.finalUnitPrice;
    }

    cart.totalQuantity = recalculateTotalQuantity(cart);
    cart.subTotal = recalculateSubTotal(cart);
    cart.payableTotal = recalculatePayableTotal(cart);

    await cart.save();
    await cart.populate(["items.product", "items.variant"]);

    cart = transformCart(cart);
    sendSuccess(res, "Item size updated", { cart }, 200);
  } catch (err) {
    console.error("Update size error:", err);
    throw err;
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

//MERGE CART
const mergeCart = async (req, res) => {
  try {
    const userId = req.user?._id;
    const guestId = req.query?.guestId;
    let cart;

    if (!userId || !guestId) {
      return res.status(400).json({ message: "Invalid merge request" });
    }

    const userCart = await Cart.findOne({ user: userId }).populate(
      "items.product",
    );
    const guestCart = await Cart.findOne({ guestId }).populate("items.product");
    const guestEmpty = !guestCart || guestCart.items.length === 0;
    const userEmpty = !userCart || userCart.items.length === 0;

    //No guestCart && No userCart = Nothing to merge
    if (guestEmpty && userEmpty) {
      return res.status(200).json({ cart: { items: [] } });
    }
    //No guestCart = Nothing to merge
    else if (guestEmpty) {
      return res.status(200).json({ cart: userCart });
    }

    // If user has no cart -> convert guest cart
    if (userEmpty) {
      guestCart.user = userId;
      guestCart.guestId = undefined;
      await guestCart.save();

      return res.status(200).json({ cart: guestCart });
    }

    // Merge items
    guestCart.items.forEach((guestItem) => {
      const existingItem = userCart.items.find(
        (userItem) =>
          userItem.product.toString() === guestItem.product.toString() &&
          userItem.size === guestItem.size &&
          userItem.color === guestItem.color,
      );

      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
        existingItem.itemTotal =
          existingItem.quantity * existingItem.finalUnitPrice;
      } else {
        userCart.items.push(guestItem);
      }
    });

    userCart.subTotal = recalculateSubTotal(userCart);
    userCart.totalQuantity = recalculateTotalQuantity(userCart);
    userCart.payableTotal = recalculatePayableTotal(userCart);

    await userCart.save();

    //Remove guestCart
    await Cart.deleteOne({ guestId });

    // await userCart.populate('items.product')

    cart = transformCart(userCart)

    sendSuccess(res, "Cart merged successfully", { cart }, 200);
  } catch (error) {
    console.error("Merge Cart error:", error);
    throw error;
  }
};

module.exports = {
  fetchCart,
  addToCart,
  syncCart,
  removeFromCart,
  updateSize,
  mergeCart,
};
