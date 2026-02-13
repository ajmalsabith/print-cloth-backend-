const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const BannerSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    subTitle: {
        type: String
    },
    primaryButtonText: {
        type: String
    },
    primaryButtonLink: {
        type: String
    },
    secondaryButtonText: {
        type: String
    },
    secondaryButtonLink: {
        type: String
    },
    backgroundImageUrl: {
        type: String,
        required: true
    },
    backgroundImagePublicId: {
        type: String,
        required: true
    },
    mobileImageUrl: {
        type: String,
        required: true
    },
    mobileImagePublicId: {
        type: String,
        required: true
    },
    bannerFor: {
        type: String,
        enum: ['All', 'Kids', 'Adult'],
        default: 'All'
    },
    backgroundColor: {
        type: String,
    },
    alignment: [{
        type: String,
        enum: ["Top", "Center", "Bottom"],
        default: 'Center'
    }],
    overlay: {
        type: Boolean,
        default: false
    },
    overlayOpacity: {
        type: Number,
        default: 0.3
    },


},{timestamps: true})


module.exports = mongoose.model('Banner', BannerSchema)
