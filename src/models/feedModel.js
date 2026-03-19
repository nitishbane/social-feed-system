const { query } = require("../db");

async function getFeedForUser(userId, limit, offset) {
  const result = await query(
    `SELECT p.id, p.user_id, p.content, p.created_at
     FROM posts p
     WHERE p.user_id IN (
       SELECT f.followee_id
       FROM follows f
       WHERE f.follower_id = $1
     )
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows;
}

module.exports = {
  getFeedForUser
};
