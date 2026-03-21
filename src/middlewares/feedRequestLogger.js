const { writeFeedLog } = require("../utils/feedLogger");

function feedRequestLogger(req, res, next) {
  const startTime = Date.now();
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    writeFeedLog({
      timestamp: new Date().toISOString(),
      request: {
        method: req.method,
        path: req.originalUrl,
        query: req.query
      },
      response: {
        statusCode: res.statusCode,
        durationMs: Date.now() - startTime
      }
    });

    return originalJson(body);
  };

  next();
}

module.exports = feedRequestLogger;
