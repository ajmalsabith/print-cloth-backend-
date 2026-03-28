const design = require("../models/design");
const Order = require("../models/Order");

const getOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total orders
    const totalOrders = await Order.countDocuments({
  orderStatus: { $ne: 'CANCELLED' },
  $or: [
    { paymentStatus: 'PAID' },
    { orderStatus: 'DELIVERED', paymentMethod: 'cod' }
  ]
});

    // Get total revenue (Sum of all completed non-refund payments/orders amount)
    const revenueResult = await Order.aggregate([
  {
     $match: {
  paymentStatus: 'PAID',
  orderStatus: { $ne: 'CANCELLED' }
},
  },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: "$totalAmount" },
    },
  },
]);

const totalRevenue =
  revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Gross profit (assume 40% margin for demo since we don't have cost price per product in model initially)
    const grossProfit = totalRevenue * 0.465;

    // Refund issued
    const refundsResult = await Order.aggregate([
  {
    $match: {
      paymentStatus: "REFUNDED",
    },
  },
  {
    $group: {
      _id: null,
      totalRefunds: { $sum: "$totalAmount" },
    },
  },
]);

const refundsIssued =
  refundsResult.length > 0 ? refundsResult[0].totalRefunds : 0;

    // Discounts
    const discountsResult = await Order.aggregate([
  {
    $match: {
  paymentStatus: 'PAID',
  orderStatus: { $ne: 'CANCELLED' }
}
  },
  {
    $group: {
      _id: null,
      totalDiscount: { $sum: "$totalDiscount" },
    },
  },
]);

const discountsGiven =
  discountsResult.length > 0 ? discountsResult[0].totalDiscount : 0;

    // Net revenue
    const netRevenue = totalRevenue - refundsIssued - discountsGiven;

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;



    res.json({
      totalRevenue,
      netRevenue,
      grossProfit,
      totalOrders,
      averageOrderValue,
      refundsIssued,
      discountsGiven,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSalesPerformance = async (req, res) => {
  try {
    const filter = req.query.filter || 'daily';
    let format = '%Y-%m-%d';
    const date = new Date();

    if (filter === 'weekly') {
      format = '%Y-%U'; // Year and week number
      date.setMonth(date.getMonth() - 3); // last 3 months for weekly
    } else if (filter === 'monthly') {
      format = '%Y-%m';
      date.setFullYear(date.getFullYear() - 1); // last 1 year for monthly
    } else {
      date.setDate(date.getDate() - 30); // last 30 days for daily
    }

    const salesData = await Order.aggregate([
      { $match: { createdAt: { $gte: date }, orderStatus: { $ne: 'CANCELLED' } } },
      {
        $group: {
          _id: { $dateToString: { format: format, date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(salesData.map((d) => ({ date: d._id, revenue: d.revenue })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderStatusBreakdown = async (req, res) => {
  try {
    const statusData = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(statusData.map((d) => ({ status: d._id, count: d.count })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDesignSources = async (req, res) => {
  try {
    const sourceData = await design.aggregate([
      {
        $group: {
          _id: '$designType',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(sourceData.map((d) => ({ source: d._id, count: d.count })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategoryPerformance = async (req, res) => {
  try {
    const categoryData = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: "CANCELLED" },
          paymentStatus: "PAID",
        },
      },

      { $unwind: "$items" },

      // Lookup Product
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productData",
        },
      },

      {
        $unwind: {
          path: "$productData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup Category using categoryId
      {
        $lookup: {
          from: "categories",
          localField: "productData.categoryId",
          foreignField: "_id",
          as: "categoryData",
        },
      },

      {
        $unwind: {
          path: "$categoryData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Group by category name
      {
        $group: {
          _id: {
            $ifNull: ["$categoryData.category", "Unknown"],
          },
          revenue: { $sum: "$items.itemTotal" },
          count: { $sum: "$items.quantity" },
        },
      },

      { $sort: { revenue: -1 } },
    ]);

    res.json(
      categoryData
    )
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
    getSalesPerformance,
    getOrderStatusBreakdown,
    getDesignSources,
    getCategoryPerformance,
    getOverview
}