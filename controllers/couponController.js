const { sendError, sendSuccess } = require("../controllers/BaseController");
const Coupon = require("../models/Coupon");
const {
  NotFoundError,
  AppError,
  ConflictError,
  ValidationError,
} = require("../utils/errors");
const logger = require("../utils/logger");
const { sendValidationError } = require("../utils/response");


    //CONVERT DATE TO IST
    const toISTDate = (dateStr) => {
  
  const date = new Date(dateStr);

  // IST offset = +5:30 = 330 minutes
  const IST_OFFSET = 330 * 60 * 1000;

  return new Date(date.getTime() + IST_OFFSET);
};

  //FETCH ALL COUPONS
  const fetchCoupons = async (req, res) => {
    try {
      const { search = "" } = req.query;

      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);

      const skip = (page - 1) * limit;
      const filter = {};

      if (search) filter.code = { $regex: search, $options: "i" };

      //total filtered coupon count
      const totalCoupons = await Coupon.countDocuments(filter);

      //paginated filtered docs
      const coupons = await Coupon.find(filter).skip(skip).limit(limit);

      const totalPages = Math.ceil(totalCoupons / limit);

      sendSuccess(res, 'Coupon added successfully', {coupons,pagination: {
          page,
          totalPages,
          totalCoupons,
          limit,
        } }, 201);

    } catch (error) {
      logger.error("Failed fetching coupons");
      throw error;
    }
  };

  const addCoupon = async (req, res) => {
    try {
      const { couponCode, ...couponData} = req.body
      const coupon = new Coupon({
        ...couponData,
        couponCode: couponCode.toUpperCase(),
        startDate: toISTDate(couponData.startDate),
        endDate: toISTDate(couponData.endDate),
      });

      await coupon.save();

      sendSuccess(res, 'Coupon added successfully', coupon, 201);
    } catch (error) {
      logger.error("Error adding coupon");
      throw error;
    }
  };

  const updateCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId
        const { couponCode, ...couponData } = req.body
      const coupon = await Coupon.findById(couponId);

      if (!coupon) {
        throw new NotFoundError("Coupon not found");
      }

      if (couponData.couponCode) {
        const existing = await Coupon.findOne({
          code: couponCode.toUpperCase(),
          _id: { $ne: couponId },
        });

        if (existing) {
          throw new ConflictError("Coupon code already exist");
        }
      }

      Object.assign(coupon, {
        ...couponData,
        couponCode: couponCode.toUpperCase(),
        startDate: toISTDate(couponData.startDate),
        endDate: toISTDate(couponData.endDate)
      });

      await coupon.save();

      sendSuccess(res, 'Coupon updated successfully', coupon, 201);
    } catch (error) {
      logger.error("Coupon updating failed");
      throw error;
    }
  };

  const deleteCoupon = async (req, res) => {
    try {
      const { couponId } = req.params
      const coupon = await Coupon.findById(couponId);
      if (!coupon) throw new NotFoundError("Coupon not found");

      await Coupon.findByIdAndDelete(couponId);

      logger.info("Coupon deleted successfully");
      sendSuccess(res, 'Coupon deleted successfully', couponId, 201);
    } catch (error) {
      logger.error("Coupon deletion failed");
      throw error;
    }
  }

module.exports = {
    fetchCoupons,
    addCoupon,
    updateCoupon,
    deleteCoupon
};
