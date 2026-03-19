const { query } = require("../db");

async function createUser(username) {
  const result = await query(
    `INSERT INTO users (username)
     VALUES ($1)
     RETURNING id, username, created_at`,
    [username]
  );

  return result.rows[0];
}

async function getUserById(id) {
  const result = await query(
    `SELECT id, username, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  createUser,
  getUserById
};
