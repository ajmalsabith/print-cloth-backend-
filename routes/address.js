const express = require("express");
const AddressController = require("../controllers/addressController");

const router = express.Router();

router.get("/address", AddressController.getAllAddress);
