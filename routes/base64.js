const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const { sendSuccess } = require("../controllers/BaseController");

router.post("/upload-base64", async (req, res) => {
  try {
      
      const { image } = req.body;
      
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: "my-app-images",
    });

    sendSuccess(res, 'image uploaded', {url: uploadRes.secure_url})
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;