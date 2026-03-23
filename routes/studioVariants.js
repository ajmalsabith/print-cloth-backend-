const express = require('express')
const { addStudioVariant, fetchStudioVariants, updateStudioVariant, deleteStudioVariant } = require('../controllers/studioVariantController')
const router = express.Router()
const upload = require('./uploads');

    router.get("/", fetchStudioVariants),

    router.post("/", upload.any(), addStudioVariant),

    router.put("/:id", upload.any(), updateStudioVariant),

    router.delete("/:id", deleteStudioVariant)

module.exports = router