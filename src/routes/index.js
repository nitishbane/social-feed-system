const express = require("express");
const userRoutes = require("./userRoutes");
const postRoutes = require("./postRoutes");
const feedRoutes = require("./feedRoutes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.use(userRoutes);
router.use(postRoutes);
router.use(feedRoutes);

module.exports = router;
