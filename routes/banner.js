const router = require("express").Router();
const { default: upload } = require("../config/multer");
const BannerController = require("../controllers/bannerController");
const { authenticateAdmin } = require("../middlewares/auth");
const Banner = require("../models/Banner");

router.post(
  "/",
  upload.single("image"),
  authenticateAdmin,
  BannerController.createBanner
);
router.get("/", BannerController.fetchBanner);
router.put(
  "/:bannerId",
  upload.single("image"),
  authenticateAdmin,
  BannerController.updateBanner
)
router.delete("/:bannerId", authenticateAdmin, BannerController.deleteBanner);
router.patch(
  "/:bannerId",
  authenticateAdmin,
  BannerController.toggleBannerStatus
);

module.exports = router;
