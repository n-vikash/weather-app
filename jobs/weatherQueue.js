const Bull = require("bull");
const weatherQueue = new Bull("weather", {
  redis: {
    host: "127.0.0.1",
    port: 6379
  }
});
weatherQueue.process(async (job) => {
  console.log("🌐 Weather job processed:", job.data);
});
module.exports = { weatherQueue };

