const config = require("../config/config");
const Banner = require("../models/Banner");
const { NotFoundError } = require("../utils/errors");
const logger = require("../utils/logger");
const { validateRequest, sendSuccess } = require("./BaseController");
const { createBannerValidation } = require("../utils/validation");


  const createBanner = async (req, res) => {
    try {
        const uploaded = req.files
            const backgroundImage = req.files?.backgroundImage?.[0];
    const mobileImage = req.files?.mobileImage?.[0];

        const { title, subTitle, status, primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, bannerFor, backgroundColor, alignment, overlay, overlayOpacity } = req.body

        const validatedData = validateRequest(createBannerValidation, {title, subTitle, status, primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, bannerFor, backgroundColor, alignment, overlay, overlayOpacity})

        console.log('req.files:', uploaded);
        console.log('val data::', validatedData);
        
            if (!uploaded) {
              throw new NotFoundError('Image file not found')
            }

        validatedData.backgroundImageUrl = backgroundImage.path
        validatedData.backgroundImagePublicId = backgroundImage.filename
        validatedData.mobileImageUrl = mobileImage.path
        validatedData.mobileImagePublicId = mobileImage.filename
        console.log('validated data in banner create:', validatedData);

      const banner = new Banner({
        ...validatedData
      });
      await banner.save();
      sendSuccess(res, 'Banner created successfully', {banner}, 201)
    } catch (error) {
      throw error;
    }
  };

  //UPDATE BANNER
  async function updateBanner (req, res) {
    try {
    const bannerId = req.params.bannerId
      const updateData = req.body
      const backgroundImage = req.files?.backgroundImage?.[0];
      const mobileImage = req.files?.mobileImage?.[0];
      if (backgroundImage) {
        updateData.backgroundImageUrl = backgroundImage.path
        updateData.backgroundImagePublicId = backgroundImage.filename
      }
      if (mobileImage) {
        updateData.mobileImageUrl = mobileImage.path
        updateData.mobileImagePublicId = mobileImage.filename
      }

      const updated = await Banner.findByIdAndUpdate(bannerId, updateData, {
        new: true,
      });
      console.log('updated banner:', updated);
      

      sendSuccess(res, 'Banner updated successfully', {banner: updated}, 201)
    } catch (error) {
      throw error;
    }
  }

  //FETCH BANNERS
  const fetchBanner = async (req, res) => {
    const { search = "", status='' } = req.query;
    console.log('status:', status);
    
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit) || 16;
    const skip = (page - 1) * limit;
    try {
      const filter = {};
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { subTitle: { $regex: search, $options: "i" } },
      ];
      const totalBanners = await Banner.find(filter).countDocuments()
      const banner = await Banner.find(filter).skip(skip).limit(limit);
      sendSuccess(res, 'Banner fetched successfully', {banner, pagination:{page ,totalItems: totalBanners, totalPages: Math.ceil(totalBanners / limit), limit}}, 200)
    } catch (error) {
      throw error;
    }
  };

  //DELETE BANNER
  const deleteBanner = async (req, res) => {
    const bannerId = req.params.bannerId
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
      sendSuccess(res, 'Banner deleted successfully', {banner}, 200)
    } catch (error) {
      throw error;
    }
  };

  //TOGGLE BANNER STATUS
  const toggleBannerStatus = async (req, res) => {
    try {
      const bannerId = req.params.bannerId
      const banner = await Banner.findById(bannerId);
      if (!banner) return new NotFoundError("Banner not found");
      banner.status = banner.status === "active" ? "inactive" : "active";
      await banner.save();
      sendSuccess(res, 'Banner status changed successfully', {banner}, 200)
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
