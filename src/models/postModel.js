const { query } = require("../db");

async function createPost(userId, content) {
  const result = await query(
    `INSERT INTO posts (user_id, content)
     VALUES ($1, $2)
     RETURNING id, user_id, content, created_at`,
    [userId, content]
  );

  return result.rows[0];
}

async function getPostById(id) {
  const result = await query(
    `SELECT id, user_id, content, created_at
     FROM posts
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

async function deletePost(id) {
  const result = await query(
    `DELETE FROM posts
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  return result.rowCount > 0;
}

module.exports = {
  createPost,
  getPostById,
  deletePost
};
