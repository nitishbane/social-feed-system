import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const FILE_ENV = loadEnvFile("./load-test.k6.env");

const BASE_URL = getEnv("LOAD_TARGET", "http://127.0.0.1:3000");
const SCENARIO = getEnv("LOAD_SCENARIO", "mixed");
const USER_COUNT = parsePositiveInt(getEnv("LOAD_USER_COUNT"), 1000);
const POST_COUNT = parsePositiveInt(getEnv("LOAD_POST_COUNT"), 20000);
const FEED_LIMIT = parsePositiveInt(getEnv("LOAD_FEED_LIMIT"), 20);
const THINK_TIME = parsePositiveFloat(getEnv("LOAD_THINK_TIME"), 0.2);

const errorRate = new Rate("errors");
const requestsByType = new Counter("requests_by_type");
const operationDuration = new Trend("operation_duration", true);

const scenarioProfiles = {
  smoke: {
    executor: "constant-vus",
    vus: parsePositiveInt(getEnv("LOAD_VUS"), 5),
    duration: getEnv("LOAD_DURATION", "30s")
  },
  ramp: {
    executor: "ramping-vus",
    startVUs: 0,
    gracefulRampDown: "10s",
    stages: [
      { duration: "30s", target: 10 },
      { duration: "1m", target: 50 },
      { duration: "1m", target: 100 },
      { duration: "30s", target: 0 }
    ]
  },
  constant: {
    executor: "constant-vus",
    vus: parsePositiveInt(getEnv("LOAD_VUS"), 50),
    duration: getEnv("LOAD_DURATION", "2m")
  }
};

const selectedExecution = scenarioProfiles[getEnv("LOAD_PROFILE", "constant")] || scenarioProfiles.constant;

export const options = {
  scenarios: {
    api_load: selectedExecution
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1000"],
    errors: ["rate<0.05"]
  }
};

const operationSets = {
  feed: [
    { name: "feed", weight: 85, run: getFeed },
    { name: "get-post", weight: 15, run: getPost }
  ],
  mixed: [
    { name: "feed", weight: 55, run: getFeed },
    { name: "get-post", weight: 15, run: getPost },
    { name: "create-post", weight: 15, run: createPost },
    { name: "like-post", weight: 10, run: likePost },
    { name: "follow-user", weight: 5, run: followUser }
  ],
  write: [
    { name: "create-post", weight: 45, run: createPost },
    { name: "like-post", weight: 25, run: likePost },
    { name: "follow-user", weight: 20, run: followUser },
    { name: "feed", weight: 10, run: getFeed }
  ]
};

export default function () {
  const operation = pickWeighted(operationSets[SCENARIO] || operationSets.mixed);
  const response = operation.run();

  requestsByType.add(1, { operation: operation.name });
  operationDuration.add(response.timings.duration, { operation: operation.name });

  const ok = check(response, {
    [`${operation.name} status is acceptable`]: (res) => res.status >= 200 && res.status < 400
  });

  errorRate.add(!ok, { operation: operation.name });
  sleep(THINK_TIME);
}

function getFeed() {
  const userId = randomId(USER_COUNT);
  const page = randomInt(1, 5);

  return http.get(`${BASE_URL}/feed?userId=${userId}&page=${page}&limit=${FEED_LIMIT}`, {
    tags: { operation: "feed" }
  });
}

function getPost() {
  return http.get(`${BASE_URL}/posts/${randomId(POST_COUNT)}`, {
    tags: { operation: "get-post" }
  });
}

function createPost() {
  const userId = randomId(USER_COUNT);
  const payload = JSON.stringify({
    userId,
    content: `k6 load-test post user-${userId} vu-${__VU} iter-${__ITER} ts-${Date.now()}`
  });

  return http.post(`${BASE_URL}/posts`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { operation: "create-post" }
  });
}

function likePost() {
  const payload = JSON.stringify({
    userId: randomId(USER_COUNT)
  });

  return http.post(`${BASE_URL}/posts/${randomId(POST_COUNT)}/like`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { operation: "like-post" }
  });
}

function followUser() {
  let followerId = randomId(USER_COUNT);
  let followeeId = randomId(USER_COUNT);

  while (followerId === followeeId) {
    followeeId = randomId(USER_COUNT);
  }

  const payload = JSON.stringify({
    followerId
  });

  return http.post(`${BASE_URL}/users/${followeeId}/follow`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { operation: "follow-user" }
  });
}

function pickWeighted(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of items) {
    roll -= item.weight;

    if (roll <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

function randomId(max) {
  return randomInt(1, max);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveFloat(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getEnv(name, fallback = undefined) {
  if (__ENV[name] !== undefined && __ENV[name] !== "") {
    return __ENV[name];
  }

  if (FILE_ENV[name] !== undefined && FILE_ENV[name] !== "") {
    return FILE_ENV[name];
  }

  return fallback;
}

function loadEnvFile(path) {
  const values = {};
  const content = open(path);
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    values[key] = stripWrappingQuotes(rawValue);
  }

  return values;
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
