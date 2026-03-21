const feedModel = require("../models/feedModel");
const parsePositiveInt = require("../utils/parsePositiveInt");

async function getFeed(req, res) {
  const userId = req.query.userId;
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
  const offset = (page - 1) * limit;
  let posts;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  try{
    posts = await feedModel.getFeedForUser(userId, limit, offset);
  }catch(e){
    console.log('Errow while getting posts ' + e)
  }
  

  return res.json({
    userId: Number(userId),
    page,
    limit,
    data: posts
  });
}

module.exports = {
  getFeed
};
