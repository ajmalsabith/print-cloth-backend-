const Order = require("../models/Order");
const { asyncHandler, sendSuccess } = require("./BaseController");

//FETCH USER ORDER
const fetchUserOrder = asyncHandler(async(req, res) => {
    try {
        console.log('in fetch order');
        
      const userId = req.user._id
      const { search = "", status="all" } = req.query;
      const page = parseInt(req.query.page) || 1;

      const limit = parseInt(req.query.limit) || 10;

      const skipValue = (page - 1) * limit;

      const filter = {};

      if (userId) filter.user = userId

      if (search) filter.orderId = { $regex: search, $options: "i" };
console.log('status:', status);

    //   if (status === '') filter.orderStatus = status;
    //   console.log('filter status', filter.orderStatus);
      

      const [orders, totalOrders] = await Promise.all([
        Order.find(filter)
          .populate("items.product")
          .sort({ createdAt: -1 })
        //   .skip(skipValue)
        //   .limit(limit),
         ,Order.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(totalOrders / limit);

      sendSuccess(res, 'Orders fetched successfully', {orders, pagination: {
          limit,
          page,
          totalPages,
          totalOrders,
        },})

    } catch (error) {
      throw error;
    }
})

module.exports = {
    fetchUserOrder,

}