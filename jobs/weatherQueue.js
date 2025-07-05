// jobs/weatherQueue.js
const Bull = require("bull");

// Create a new queue named "weather"
const weatherQueue = new Bull("weather", {
  redis: {
    host: "127.0.0.1",
    port: 6379
  }
});

// Optional background job processor (logs job data)
weatherQueue.process(async (job) => {
  console.log("🌐 Weather job processed:", job.data);
  // You could log this to a DB or a file in real projects
});

module.exports = { weatherQueue };

