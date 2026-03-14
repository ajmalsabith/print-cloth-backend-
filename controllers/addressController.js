const Address = require("../models/Address");

// GET ALL ADDRESS
const getAllAddress = asyncHandler(async (req, res) => {
  try {
    const address = await Address.find({});

    sendSuccess(res, "All address retrieved successfully", address, 200);
  } catch (err) {
    logger.error(err);
    throw err;
  }
});



module.exports = {
    getAllAddress
};