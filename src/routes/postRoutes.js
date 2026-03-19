const express = require("express");
const postController = require("../controllers/postController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/posts", asyncHandler(postController.createPost));
router.get("/posts/:id", asyncHandler(postController.getPost));
router.delete("/posts/:id", asyncHandler(postController.deletePost));
router.post("/posts/:id/like", asyncHandler(postController.likePost));
router.delete("/posts/:id/like", asyncHandler(postController.unlikePost));

module.exports = router;
