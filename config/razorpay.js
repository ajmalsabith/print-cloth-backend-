const Razorpay = require("razorpay");
const { RAZORPAY } = require("./config");

const razorpay = new Razorpay({
  key_id: RAZORPAY.API_KEY,
  key_secret: RAZORPAY.SECRET_KEY
});

module.exports = razorpay;