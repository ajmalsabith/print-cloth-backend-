const express = require('express')
const router = express.Router()
const upload = require('./uploads');
const { saveUserDesign, fetchUserDesign, deleteUserDesign } = require('../controllers/userDesignController');
const { authenticateUser } = require('../middlewares/auth');

    router.post("/", authenticateUser, saveUserDesign),

    router.get("/", authenticateUser, fetchUserDesign),

    router.delete("/:id", authenticateUser, deleteUserDesign);

    // router.post("/", upload.any(), addStudioVariant),

    // router.put("/:id", upload.any(), updateStudioVariant),

    // router.delete("/:id", deleteStudioVariant)

module.exports = router