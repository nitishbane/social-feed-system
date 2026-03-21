const fs = require("fs");
const path = require("path");

const logDir = path.join(process.cwd(), "logs");
const logFile = path.join(logDir, "feed-endpoint.log");

function writeFeedLog(entry) {
  fs.mkdirSync(logDir, { recursive: true });

  fs.appendFile(logFile, `${JSON.stringify(entry)}\n`, (error) => {
    if (error) {
      console.error("Failed to write feed log", error);
    }
  });
}

module.exports = {
  logFile,
  writeFeedLog
};
