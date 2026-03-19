const { query } = require("../db");

async function createFollow(followerId, followeeId) {
  const result = await query(
    `INSERT INTO follows (follower_id, followee_id)
     VALUES ($1, $2)
     ON CONFLICT (follower_id, followee_id) DO NOTHING
     RETURNING follower_id, followee_id, created_at`,
    [followerId, followeeId]
  );

  return result.rows[0] || null;
}

async function deleteFollow(followerId, followeeId) {
  const result = await query(
    `DELETE FROM follows
     WHERE follower_id = $1 AND followee_id = $2
     RETURNING follower_id, followee_id`,
    [followerId, followeeId]
  );

  return result.rowCount > 0;
}

module.exports = {
  createFollow,
  deleteFollow
};
