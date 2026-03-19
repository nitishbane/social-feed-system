# Social Feed System

Baseline Node.js + PostgreSQL implementation generated from the shared system design thread.

## Structure

- `src/routes`: route definitions
- `src/controllers`: request handling
- `src/models`: database access
- `src/middlewares`: shared middleware
- `src/utils`: small reusable helpers

## Endpoints

- `POST /users`
- `GET /users/:id`
- `POST /posts`
- `GET /posts/:id`
- `DELETE /posts/:id`
- `POST /posts/:id/like`
- `DELETE /posts/:id/like`
- `POST /users/:id/follow`
- `DELETE /users/:id/follow`
- `GET /feed?userId=123&page=1&limit=20`

## Request examples

Create user:

```http
POST /users
Content-Type: application/json

{
  "username": "nitish"
}
```

Create post:

```http
POST /posts
Content-Type: application/json

{
  "userId": 1,
  "content": "hello feed"
}
```

Like post:

```http
POST /posts/10/like
Content-Type: application/json

{
  "userId": 2
}
```

Follow user:

```http
POST /users/2/follow
Content-Type: application/json

{
  "followerId": 1
}
```

Feed:

```http
GET /feed?userId=1&page=1&limit=20
```

## Database

- Baseline schema: [`db/schema.sql`](/home/nitish/Shared/Personal/social-feed-system/db/schema.sql)
- Optional stage 5 fan-out-on-write table: [`db/stage5_feeds.sql`](/home/nitish/Shared/Personal/social-feed-system/db/stage5_feeds.sql)

## Run

1. Copy `.env.example` to `.env`
2. Create the database
3. Apply `db/schema.sql`
4. Install dependencies with `npm install`
5. Start the API with `npm start`

Database env vars:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=social_feed
```

`DATABASE_URL` is also supported as an optional override.

## Seed Test Data

Run:

```bash
npm run seed
```

Set values in `.env`:

```bash
SEED_COUNT=100
SEED_RESET_DB=true
```

Optional env vars:

- `SEED_COUNT` to create exactly that many rows in each table: `users`, `posts`, `follows`, and `likes`
- `SEED_USER_COUNT` default `50`
- `SEED_POSTS_PER_USER` default `5`
- `SEED_MAX_FOLLOWS_PER_USER` default `15`
- `SEED_MAX_LIKES_PER_USER` default `20`
- `SEED_RESET_DB=true` to truncate existing data before seeding

Example:

```bash
SEED_RESET_DB=true SEED_USER_COUNT=100 SEED_POSTS_PER_USER=10 npm run seed
```

Exact-count example:

```bash
SEED_COUNT=100
SEED_RESET_DB=true
npm run seed
```
