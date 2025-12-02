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

const upload = multer({ storage });

// MULTIPLE IMAGE UPLOAD API
router.post("/upload-images", upload.array("images", 10), (req, res) => {
  const urls = req.files.map(file => ({
    url: file.path,
    public_id: file.filename
  }));

  res.json({
    message: "Images uploaded successfully",
    files: urls
  });
});

module.exports = router;
