require('dotenv').config()
const { Pool } = require("pg");

function getDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL
    };
  }

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT, 10) : 5432;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!host || !user || !password || !database) {
    throw new Error("Set DATABASE_URL or all of DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME");
  }

  return {
    host,
    port,
    user,
    password,
    database
  };
}

const pool = new Pool(getDatabaseConfig());

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = {
  pool,
  query
};
