const Address = require("../models/Address");
const { sendSuccess } = require("../utils/response");


// CREATE ADDRESS
const createAddress = async(req, res) => {
  try {
    const {
      userId,
      label,
      fullName,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefaultShipping,
      isDefaultBilling,
    } = req.body;

    const address = await Address.create({
      userId,
      label,
      fullName,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefaultShipping,
      isDefaultBilling,
    });

    sendSuccess(res, "Address created successfully", address, 201);
  } catch (err) {
    console.error(err);
    throw err;
  }
}


// UPDATE ADDRESS
const updateAddress = async(req, res) => {
  try {
    const { addressId } = req.params;

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      req.body,
      { new: true }
    );

    if (!updatedAddress) {
      return sendError(res, "Address not found", 404);
    }

    sendSuccess(res, "Address updated successfully", updatedAddress, 200);
  } catch (err) {
    console.error(err);
    throw err;
  }
}


// GET ADDRESS BY USER ID
const getAddressByUserId = async(req, res) => {
  try {
    const { userId } = req.params;

    const address = await Address.find({ userId });

    sendSuccess(res, "User address retrieved successfully", address, 200);
  } catch (err) {
    console.error(err);
    throw err;
  }
}


// DELETE ADDRESS
const deleteAddress = async(req, res) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findByIdAndDelete(addressId);

    if (!address) {
      return sendError(res, "Address not found", 404);
    }

    sendSuccess(res, "Address deleted successfully", address, 200);
  } catch (err) {
    console.error(err);
    throw err;
  }
}


module.exports = {
    deleteAddress,
    getAddressByUserId,
    updateAddress,
    createAddress
};