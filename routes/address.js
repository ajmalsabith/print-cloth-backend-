const express = require("express");
const AddressController = require("../controllers/addressController");

const router = express.Router();

router.post("/createAddress", AddressController.createAddress);
router.put("/updateAddress/:addressId", AddressController.updateAddress);
router.get("/getAddress/:userId", AddressController.getAddressByUserId);
router.delete("/deleteAddress/:addressId", AddressController.deleteAddress);


module.exports = router;

