const design = require("../models/design");
const Order = require("../models/Order");

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

module.exports = {
    getSalesPerformance,
    getOrderStatusBreakdown,
    getDesignSources
}