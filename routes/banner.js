const router = require("express").Router();
const upload = require('./uploads');
const BannerController = require("../controllers/bannerController");
const { authenticateAdmin } = require("../middlewares/auth");
const Banner = require("../models/Banner");

router.post(
  "/",
  upload.fields([{name: 'backgroundImage', maxCount: 1}, {name: 'mobileImage', maxCount: 1}]),
  authenticateAdmin,
  BannerController.createBanner
);
router.get("/", BannerController.fetchBanner);
router.put(
  "/:bannerId/update",
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
