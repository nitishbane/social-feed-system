const userModel = require("../models/userModel");
const followModel = require("../models/followModel");

async function createUser(req, res) {
  const { username } = req.body;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "username is required" });
  }

  const user = await userModel.createUser(username.trim());
  return res.status(201).json(user);
}

async function getUser(req, res) {
  const user = await userModel.getUserById(req.params.id);

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  return res.json(user);
}

async function followUser(req, res) {
  const { followerId } = req.body;
  const followeeId = req.params.id;

  if (!followerId) {
    return res.status(400).json({ error: "followerId is required" });
  }

  if (String(followerId) === String(followeeId)) {
    return res.status(400).json({ error: "users cannot follow themselves" });
  }

  const follow = await followModel.createFollow(followerId, followeeId);

  if (!follow) {
    return res.status(200).json({ message: "already following user" });
  }

  return res.status(201).json(follow);
}

async function unfollowUser(req, res) {
  const followerId = req.body.followerId || req.query.followerId;
  const followeeId = req.params.id;

  if (!followerId) {
    return res.status(400).json({ error: "followerId is required" });
  }

  const deleted = await followModel.deleteFollow(followerId, followeeId);

  if (!deleted) {
    return res.status(404).json({ error: "follow relationship not found" });
  }

  return res.status(204).send();
}

module.exports = {
  createUser,
  getUser,
  followUser,
  unfollowUser
};
