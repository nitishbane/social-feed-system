const express = require("express");
const userController = require("../controllers/userController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/users", asyncHandler(userController.createUser));
router.get("/users/:id", asyncHandler(userController.getUser));
router.post("/users/:id/follow", asyncHandler(userController.followUser));
router.delete("/users/:id/follow", asyncHandler(userController.unfollowUser));

module.exports = router;
