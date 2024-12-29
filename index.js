const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config(); // Load .env file

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Example routes
app.get("/", (req, res) => {
  res.send("API is running on Vercel!");
});

// Connect to MongoDB
mongoose
  .connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start the server (no need to specify port manually for Vercel)
module.exports = app;
