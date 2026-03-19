const { query } = require("../db");

async function createLike(userId, postId) {
  const result = await query(
    `INSERT INTO likes (user_id, post_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, post_id) DO NOTHING
     RETURNING user_id, post_id, created_at`,
    [userId, postId]
  );

  return result.rows[0] || null;
}

async function deleteLike(userId, postId) {
  const result = await query(
    `DELETE FROM likes
     WHERE user_id = $1 AND post_id = $2
     RETURNING user_id, post_id`,
    [userId, postId]
  );

  return result.rowCount > 0;
}

module.exports = {
  createLike,
  deleteLike
};
