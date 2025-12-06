const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "my-app-images",  // Cloudinary folder name
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only images allowed"), false);
};

const upload = multer({ storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
 });

module.exports = upload;
