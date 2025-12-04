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

// MULTIPLE IMAGE UPLOAD API
router.post("/upload-images", upload.array("images", 10), (req, res) => {
  try {
    const files = req.files.map(file => ({
    url: file.path,
    public_id: file.filename || file.public_id
  }));

  res.json({
    success: true,
    message: "Images uploaded successfully",
    files
  });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
});

// DELETE IMAGE
router.delete("/delete-image/:publicId", async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ success: true, message: "Image deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
})

module.exports = router;
