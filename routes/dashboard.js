const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const authMiddleware = require("../middleware/authMiddleware");
const { weatherQueue } = require("../jobs/weatherQueue");

const defaultCities = ["Delhi", "Mumbai", "Chennai", "Hyderabad", "Vizianagaram"];

router.get("/profile", (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect("/signin");
  res.render("profile", { user });
});


router.get("/dashboard", async (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect("/signin");

  try {
    const weatherCards = await Promise.all(
      defaultCities.map(async (city) => {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        // ✅ Add this check to prevent error if city is not found or API fails
        if (!data.main || !data.weather || !data.wind) {
          console.error(`Weather API failed for city: ${city}`);
          return {
            name: city,
            temperature: "N/A",
            image: `/images/${city.toLowerCase()}.jpg`,
          };
        }

        return {
          name: city,
          temperature: `${data.main.temp}°C`,
          image: `/images/${city.toLowerCase()}.jpg`,
        };
      })
    );

    res.render("dashboard", { user, weatherCards });

  } catch (err) {
    console.error("Dashboard Error:", err);
    res.render("error", { error: "Failed to load dashboard weather data." });
  }
});
// ✅ Protected route
router.get("/", authMiddleware, async (req, res) => {
  const user = req.session.user;
  // your weather logic...
  res.render("dashboard", { user, weatherCards });
});

router.get("/profile", authMiddleware, (req, res) => {
  const user = req.session.user;
  res.render("profile", { user });
});

module.exports = router;
