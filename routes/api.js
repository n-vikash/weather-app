const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
require("dotenv").config();

const API_KEY = process.env.OPENWEATHER_API_KEY;

// ✅ Show weather details
router.get("/weather-details/:city", async (req, res) => {
  const cityName = req.params.city;

  try {
   const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=metric&appid=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.main || !data.weather || !data.wind) {
      console.error("❌ Weather API error for city:", cityName);
      return res.render("error", { error: "City not found or weather data unavailable." });
    }

    const city = {
      name: data.name,
      temp: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      wind: data.wind.speed
    };

    res.render("weather-details", { city });

  } catch (err) {
    console.error("❌ Weather Details Error:", err);
    res.render("error", { error: "Error loading weather data." });
  }
});

// ✅ Handle city search from form
router.get("/weather/search", (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.render("error", { error: "Please enter a city to search." });
  }
  res.redirect(`/api/weather-details/${encodeURIComponent(city)}`);
});

module.exports = router;
