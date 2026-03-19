require("dotenv").config();

const crypto = require("crypto");
const { pool } = require("../src/db");

const EXACT_COUNT = parseCountArg(process.env.SEED_COUNT);
const USER_COUNT = EXACT_COUNT ?? parseEnvInt("SEED_USER_COUNT", 50);
const POSTS_PER_USER = parseEnvInt("SEED_POSTS_PER_USER", 5);
const MAX_FOLLOWS_PER_USER = parseEnvInt("SEED_MAX_FOLLOWS_PER_USER", 15);
const MAX_LIKES_PER_USER = parseEnvInt("SEED_MAX_LIKES_PER_USER", 20);
const RESET_DB = process.env.SEED_RESET_DB === "true";
const RUN_LABEL = process.env.SEED_RUN_LABEL || createRunLabel();

function parseEnvInt(name, fallback) {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isNaN(value) || value < 0 ? fallback : value;
}

function parseCountArg(value) {
  if (value === undefined) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createRunLabel() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${timestamp}_${suffix}`;
}

function sampleUniqueIds(ids, count, excludedId) {
  const candidates = ids.filter((id) => id !== excludedId);
  const chosen = [];
  const used = new Set();
  const target = Math.min(count, candidates.length);

  while (chosen.length < target) {
    const value = candidates[randomInt(0, candidates.length - 1)];
    if (!used.has(value)) {
      used.add(value);
      chosen.push(value);
    }
  }

  return chosen;
}

async function bulkInsert(client, tableName, columns, rows) {
  if (rows.length === 0) {
    return [];
  }

  const values = [];
  const placeholders = rows.map((row, rowIndex) => {
    const offset = rowIndex * columns.length;
    const rowPlaceholders = row.map((_value, columnIndex) => `$${offset + columnIndex + 1}`);
    values.push(...row);
    return `(${rowPlaceholders.join(", ")})`;
  });

  const sql = `
    INSERT INTO ${tableName} (${columns.join(", ")})
    VALUES ${placeholders.join(", ")}
    RETURNING *
  `;

  const result = await client.query(sql, values);
  return result.rows;
}

async function resetDatabase(client) {
  await client.query("TRUNCATE TABLE likes, follows, posts, users RESTART IDENTITY CASCADE");
}

async function seedUsers(client) {
  const rows = Array.from({ length: USER_COUNT }, (_value, index) => [
    `user_${RUN_LABEL}_${String(index + 1).padStart(4, "0")}`
  ]);

  return bulkInsert(client, "users", ["username"], rows);
}

async function seedPosts(client, userIds, targetCount) {
  const rows = [];
  const postCount = targetCount ?? userIds.length * POSTS_PER_USER;

  if (userIds.length === 0 || postCount === 0) {
    return [];
  }

  for (let index = 0; index < postCount; index += 1) {
    const userId = userIds[index % userIds.length];
    rows.push([userId, `Seed run ${RUN_LABEL}: post ${index + 1} from user ${userId}`]);
  }

  return bulkInsert(client, "posts", ["user_id", "content"], rows);
}

function createFollowPairs(userIds, targetCount) {
  if (targetCount === 0) {
    return [];
  }

  if (userIds.length < 2) {
    throw new Error("At least 2 users are required to create follow rows");
  }

  const maxPairs = userIds.length * (userIds.length - 1);
  if (targetCount > maxPairs) {
    throw new Error(`Cannot create ${targetCount} unique follow rows with ${userIds.length} users`);
  }

  const rows = [];
  let offset = 1;

  while (rows.length < targetCount) {
    for (let index = 0; index < userIds.length && rows.length < targetCount; index += 1) {
      const followerId = userIds[index];
      const followeeId = userIds[(index + offset) % userIds.length];
      if (followerId !== followeeId) {
        rows.push([followerId, followeeId]);
      }
    }

    offset += 1;
  }

  return rows;
}

async function seedFollows(client, userIds, targetCount) {
  if (targetCount !== undefined) {
    const rows = createFollowPairs(userIds, targetCount);
    return bulkInsert(client, "follows", ["follower_id", "followee_id"], rows);
  }

  const rows = [];
  const seen = new Set();

  for (const followerId of userIds) {
    const followCount = randomInt(0, MAX_FOLLOWS_PER_USER);
    const followeeIds = sampleUniqueIds(userIds, followCount, followerId);

    for (const followeeId of followeeIds) {
      const key = `${followerId}:${followeeId}`;
      if (!seen.has(key)) {
        seen.add(key);
        rows.push([followerId, followeeId]);
      }
    }
  }

  return bulkInsert(client, "follows", ["follower_id", "followee_id"], rows);
}

function createLikePairs(userIds, postIds, targetCount) {
  if (targetCount === 0) {
    return [];
  }

  if (userIds.length === 0 || postIds.length === 0) {
    throw new Error("Users and posts are required to create like rows");
  }

  const maxPairs = userIds.length * postIds.length;
  if (targetCount > maxPairs) {
    throw new Error(`Cannot create ${targetCount} unique like rows with ${userIds.length} users and ${postIds.length} posts`);
  }

  const rows = [];
  let postOffset = 0;

  while (rows.length < targetCount) {
    for (let index = 0; index < userIds.length && rows.length < targetCount; index += 1) {
      const userId = userIds[index];
      const postId = postIds[(index + postOffset) % postIds.length];
      rows.push([userId, postId]);
    }

    postOffset += 1;
  }

  return rows;
}

async function seedLikes(client, userIds, posts, targetCount) {
  const rows = [];
  const seen = new Set();
  const postIds = posts.map((post) => post.id);

  if (targetCount !== undefined) {
    const exactRows = createLikePairs(userIds, postIds, targetCount);
    return bulkInsert(client, "likes", ["user_id", "post_id"], exactRows);
  }

  for (const userId of userIds) {
    const likeCount = randomInt(0, Math.min(MAX_LIKES_PER_USER, postIds.length));
    const likedPostIds = sampleUniqueIds(postIds, likeCount);

    for (const postId of likedPostIds) {
      const key = `${userId}:${postId}`;
      if (!seen.has(key)) {
        seen.add(key);
        rows.push([userId, postId]);
      }
    }
  }

  return bulkInsert(client, "likes", ["user_id", "post_id"], rows);
}

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (RESET_DB) {
      await resetDatabase(client);
    }

    const users = await seedUsers(client);
    const userIds = users.map((user) => user.id);
    const posts = await seedPosts(client, userIds, EXACT_COUNT ?? undefined);
    const follows = await seedFollows(client, userIds, EXACT_COUNT ?? undefined);
    const likes = await seedLikes(client, userIds, posts, EXACT_COUNT ?? undefined);

    await client.query("COMMIT");

    console.log("Seed completed successfully");
    console.log(
      JSON.stringify(
        {
          users: users.length,
          posts: posts.length,
          follows: follows.length,
          likes: likes.length,
          resetDb: RESET_DB,
          runLabel: RUN_LABEL,
          exactCount: EXACT_COUNT
        },
        null,
        2
      )
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed");
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
