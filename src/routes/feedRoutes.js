const express = require("express");
const feedController = require("../controllers/feedController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/feed", feedController.getFeed);

module.exports = router;
