function errorHandler(err, _req, res, _next) {
  if (err.code === "23505") {
    return res.status(409).json({ error: "resource already exists" });
  }

  if (err.code === "23503") {
    return res.status(400).json({ error: "referenced record does not exist" });
  }

  console.error(err);
  return res.status(500).json({ error: "internal server error" });
}

module.exports = errorHandler;
