const config = require("../config/config");
const Banner = require("../models/Banner");
const { NotFoundError } = require("../utils/errors");
const logger = require("../utils/logger");
const { validateRequest } = require("./BaseController");
const { createBannerValidation } = require("../utils/validation");


  const createBanner = async (req) => {
    try {
        const uploaded = req.files

        const { title, subTitle, primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, backgroundImageUrl, mobileImageUrl, bannerFor, backgroundColor, alignment, overlay, overlayOpacity } = req.body

        const validatedData = validateRequest(createBannerValidation, {title, subTitle, primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, backgroundImageUrl, mobileImageUrl, bannerFor, backgroundColor, alignment, overlay, overlayOpacity})

            if (!uploaded) {
              throw new NotFoundError('Image file not found')
            }

        validatedData.backgroundImageUrl = req.files[0].path
        validatedData.backgroundImagePublicId = req.files[0].filename
        validatedData.mobileImageUrl = req.files[1].filename
        validatedData.mobileImagePublicId = req.files[1].filename
        console.log('validated data in banner create:', validatedData);

      const banner = new Banner({
        validatedData
      });
      await banner.save();
      return banner;
    } catch (error) {
      throw error;
    }
  };

  //UPDATE BANNER
  async function updateBanner (req) {
    try {
      const updateData = req.body
      if (req.file) {
        
      }

      const updated = await Banner.findByIdAndUpdate(bannerId, updateData, {
        new: true,
      });

      return updated;
    } catch (error) {
      throw error;
    }
  }

  //FETCH BANNERS
  const fetchBanner = async (data) => {
    const { search = "" } = data;
    try {
      const filter = {};
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { subTitle: { $regex: search, $options: "i" } },
      ];
      const banner = await Banner.find(filter);
      return banner;
    } catch (error) {
      throw error;
    }
  };

  //DELETE BANNER
  const deleteBanner = async (bannerId) => {
    try {
      const banner = await Banner.findByIdAndDelete(bannerId);
      //delete image from s3 in prod
      if (config.NODE_ENV === "production") {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: config.AWS.BUCKET_NAME,
            Key: banner.image?.key,
          })
        );
      }
      return banner;
    } catch (error) {
      throw error;
    }
  };

  //TOGGLE BANNER STATUS
  const toggleBannerStatus = async (bannerId) => {
    try {
      const banner = await Banner.findById(bannerId);
      if (!banner) return new NotFoundError("Banner not found");
      banner.status = banner.status === "active" ? "inactive" : "active";
      await banner.save();
      return banner;
    } catch (error) {
      throw error;
    }
  }

module.exports = {
    createBanner,
    updateBanner,
    fetchBanner,
    deleteBanner,
    toggleBannerStatus
};
