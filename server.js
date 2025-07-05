require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const redis = require("redis");
const { weatherQueue } = require("./jobs/weatherQueue");

// Bull Board v6.10.1
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const { ExpressAdapter } = require("@bull-board/express");

// App setup
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Redis client (for local or Upstash)
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
    rejectUnauthorized: false
  }
});

redisClient.connect()
  .then(() => console.log("✅ Redis connected (Upstash)"))
  .catch(err => console.error("❌ Redis connection error:", err));

app.set("cache", redisClient);


// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "task8-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  })
);

// Static files and views
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Bull Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullAdapter(weatherQueue)],
  serverAdapter,
});
app.use("/admin/queues", serverAdapter.getRouter());

// Routes
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const apiRoutes = require("./routes/api");
const indexRoutes = require("./routes/index");

app.use("/auth", authRoutes);
app.use("/", dashboardRoutes);
app.use("/api", apiRoutes);
app.use("/", indexRoutes);

// Home page (fallback)
app.get("/", (req, res) => {
  res.render("index");
});

// 404 fallback
app.use((req, res) => res.status(404).render("error"));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
