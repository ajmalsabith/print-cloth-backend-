const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const { sendSuccess } = require("../controllers/BaseController");
const upload = require("./uploads");

router.post("/upload", upload.single('image'), async (req, res) => {
  console.log('here in upload')
  try {
      console.log('req.files:', req.file)
      const file = req.file;
      
    if (!file) {
      return res.status(400).json({ error: "No image provided" });
    }

    sendSuccess(res, 'image uploaded', {url: file.path})
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;