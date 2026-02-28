const Order = require("../models/Order");
const { asyncHandler, sendSuccess } = require("./BaseController");

//FETCH USER ORDER
const fetchOrder = asyncHandler(async(req, res) => {
    try {
        
        const userId = req?.user?._id 
        const adminId = req.admin?._id
        console.log('in fetch order', userId);

      const { search = "", status="ALL" } = req.query;
      console.log('req.query', req.query);
      console.log('req.params', req.params);
      
      const page = parseInt(req.query.page) || 1;

      const limit = parseInt(req.query.limit) || 10;

      const skipValue = (page - 1) * limit;

      const filter = {};

      if (userId) filter.user = userId

      if (search) filter.orderId = { $regex: search, $options: "i" };
      

console.log('status:', filter);

        if(status !== 'ALL') {
            filter.orderStatus = status
        }
      
      const [orders, totalOrders] = await Promise.all([
        Order.find(filter)
          .populate("items.product")
          .sort({ createdAt: -1 })
          .skip(skipValue)
          .limit(limit)
         ,Order.countDocuments(filter),
      ]);
      
      const totalPages = Math.ceil(totalOrders / limit);
      console.log('total order', search);

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

//UPDATE ORDER
const updateOrderStatus = asyncHandler(async(req, res) => {
   try {
     const { orderId, status } = req.query
    console.log('params', req.query);

    const order = await Order.findByIdAndUpdate(orderId, {orderStatus: status}, {new: true})

    sendSuccess(res, 'Status updated successfully', {order}, 200)

   } catch (error) {
    throw error
   }
})

module.exports = {
    fetchOrder,
    updateOrderStatus

}