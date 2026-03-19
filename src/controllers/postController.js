const postModel = require("../models/postModel");
const likeModel = require("../models/likeModel");

async function createPost(req, res) {
  const { userId, content } = req.body;

  if (!userId || !content || typeof content !== "string") {
    return res.status(400).json({ error: "userId and content are required" });
  }

  const post = await postModel.createPost(userId, content.trim());
  return res.status(201).json(post);
}

async function getPost(req, res) {
  const post = await postModel.getPostById(req.params.id);

  if (!post) {
    return res.status(404).json({ error: "post not found" });
  }

  return res.json(post);
}

async function deletePost(req, res) {
  const deleted = await postModel.deletePost(req.params.id);

  if (!deleted) {
    return res.status(404).json({ error: "post not found" });
  }

  return res.status(204).send();
}

async function likePost(req, res) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const like = await likeModel.createLike(userId, req.params.id);

  if (!like) {
    return res.status(200).json({ message: "post already liked" });
  }

  return res.status(201).json(like);
}

async function unlikePost(req, res) {
  const userId = req.body.userId || req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const deleted = await likeModel.deleteLike(userId, req.params.id);

  if (!deleted) {
    return res.status(404).json({ error: "like not found" });
  }

  return res.status(204).send();
}

module.exports = {
  createPost,
  getPost,
  deletePost,
  likePost,
  unlikePost
};
