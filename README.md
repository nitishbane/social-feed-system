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

## Load Testing

Use the built-in load generator to hit your local or EC2-hosted API with feed-heavy, mixed, or write-heavy traffic.

Seed enough data first so reads and writes are realistic:

```bash
SEED_RESET_DB=true SEED_USER_COUNT=1000 SEED_POSTS_PER_USER=20 npm run seed
```

Then run a load test against the deployed API:

```bash
npm run load -- --url http://YOUR_EC2_PUBLIC_IP:3000 --scenario mixed --concurrency 50 --duration 60 --users 1000 --posts 20000
```

Useful scenarios:

- `feed`: mostly `GET /feed`, good for measuring feed-query scaling
- `mixed`: a more realistic blend of reads and writes
- `write`: mostly post creation, likes, and follows to stress write paths

Useful flags:

- `--concurrency`: number of parallel workers sending requests
- `--duration`: test length in seconds
- `--users`: highest user id to randomly target
- `--posts`: highest post id to randomly target
- `--timeout`: request timeout in milliseconds

Equivalent environment variables are also supported:

```bash
LOAD_TARGET=http://YOUR_EC2_PUBLIC_IP:3000
LOAD_SCENARIO=feed
LOAD_CONCURRENCY=100
LOAD_DURATION=120
LOAD_USER_COUNT=1000
LOAD_POST_COUNT=20000
npm run load
```

What to watch while the test runs:

- API metrics: CPU usage, memory usage, event-loop stalls, error rate, and latency percentiles
- PostgreSQL metrics: CPU, connections, buffer/cache hit ratio, slow queries, lock waits, and disk I/O
- EC2 metrics in CloudWatch: `CPUUtilization`, network in/out, EBS read/write ops, and status checks

Suggested progression:

1. Start with `concurrency=10` for a baseline.
2. Increase in steps like `25`, `50`, `100`, `200`.
3. Record throughput, p95 latency, and error rate at each step.
4. Stop when latency rises sharply or errors begin to appear consistently.

For this codebase, `GET /feed` is the main read hotspot because it depends on the follower graph plus post ordering, while `POST /posts`, likes, and follows are the main write paths to stress.

### k6 Load Testing

If you want stronger reporting and better virtual-user modeling, use the `k6` script in [`scripts/load-test.k6.js`](/home/nitish/Shared/Personal/social-feed-system/scripts/load-test.k6.js).

The script now reads defaults from [`scripts/load-test.k6.env`](/home/nitish/Shared/Personal/social-feed-system/scripts/load-test.k6.env), so you can edit that file and run `k6` without passing a long list of `-e` flags.

Edit the env file:

```bash
LOAD_TARGET=http://YOUR_EC2_PUBLIC_IP:3000
LOAD_SCENARIO=mixed
LOAD_PROFILE=constant
LOAD_VUS=50
LOAD_DURATION=2m
LOAD_USER_COUNT=1000
LOAD_POST_COUNT=20000
LOAD_FEED_LIMIT=20
LOAD_THINK_TIME=0.2
```

Then run:

```bash
k6 run scripts/load-test.k6.js
```

Command-line `-e` values still override the env file when you want to change something for one run:

```bash
k6 run -e LOAD_PROFILE=ramp -e LOAD_SCENARIO=feed scripts/load-test.k6.js
```

Example commands:

```bash
k6 run -e LOAD_TARGET=http://YOUR_EC2_PUBLIC_IP:3000 \
  -e LOAD_SCENARIO=feed \
  -e LOAD_PROFILE=constant \
  -e LOAD_VUS=50 \
  -e LOAD_DURATION=2m \
  -e LOAD_USER_COUNT=1000 \
  -e LOAD_POST_COUNT=20000 \
  scripts/load-test.k6.js
```

Ramp test:

```bash
k6 run -e LOAD_TARGET=http://YOUR_EC2_PUBLIC_IP:3000 \
  -e LOAD_SCENARIO=mixed \
  -e LOAD_PROFILE=ramp \
  -e LOAD_USER_COUNT=1000 \
  -e LOAD_POST_COUNT=20000 \
  scripts/load-test.k6.js
```

Supported `k6` environment variables:

- `LOAD_TARGET`: base API URL
- `LOAD_SCENARIO`: `feed`, `mixed`, or `write`
- `LOAD_PROFILE`: `smoke`, `constant`, or `ramp`
- `LOAD_VUS`: virtual users for `smoke` and `constant`
- `LOAD_DURATION`: duration for `smoke` and `constant`
- `LOAD_USER_COUNT`: maximum user id to target
- `LOAD_POST_COUNT`: maximum post id to target
- `LOAD_FEED_LIMIT`: page size for `GET /feed`
- `LOAD_THINK_TIME`: sleep between iterations in seconds

Profile behavior:

- `smoke`: a small sanity run before heavier testing
- `constant`: stable load at a fixed virtual-user count
- `ramp`: gradually increases VUs to help find the saturation point

Execution flow:

1. `k6` loads the script and reads configuration from `scripts/load-test.k6.env` plus any `-e` overrides passed on the command line.
2. The script selects a load profile from `smoke`, `constant`, or `ramp`.
3. `k6` starts the configured number of virtual users (VUs).
4. Each VU repeatedly runs one loop until the test duration ends:
   - pick one operation based on the selected scenario weights
   - make exactly one HTTP request
   - record metrics and checks
   - sleep for `LOAD_THINK_TIME`
5. All VUs run independently, so the script generates concurrent requests across VUs. A single VU is sequential, but many VUs run in parallel.

Scenario request mix:

- `feed` scenario:
  - `GET /feed`: 85%
  - `GET /posts/:id`: 15%
- `mixed` scenario:
  - `GET /feed`: 55%
  - `GET /posts/:id`: 15%
  - `POST /posts`: 15%
  - `POST /posts/:id/like`: 10%
  - `POST /users/:id/follow`: 5%
- `write` scenario:
  - `POST /posts`: 45%
  - `POST /posts/:id/like`: 25%
  - `POST /users/:id/follow`: 20%
  - `GET /feed`: 10%

How many times each API is called:

- If the test performs `N` total iterations, then the expected number of calls to each endpoint is its scenario percentage multiplied by `N`.
- `N` is not hardcoded. It depends on:
  - the number of VUs
  - the test duration
  - API response time
  - `LOAD_THINK_TIME`
- Approximate total iterations:

```text
N ~= (number of VUs * test duration in seconds) / (average request time + LOAD_THINK_TIME)
```

With the current default values:

- `LOAD_PROFILE=constant`
- `LOAD_VUS=50`
- `LOAD_DURATION=2m`
- `LOAD_THINK_TIME=0.2`

the approximate total iteration count is:

```text
N ~= (50 * 120) / (average request time + 0.2)
```
