const express = require("express");
const feedController = require("../controllers/feedController");
const asyncHandler = require("../utils/asyncHandler");
const feedRequestLogger = require("../middlewares/feedRequestLogger");

const router = express.Router();

router.get("/feed", feedRequestLogger, asyncHandler(feedController.getFeed));

module.exports = router;
