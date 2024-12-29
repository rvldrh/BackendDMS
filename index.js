const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config(); // Load .env file

const app = express();
const barang_masuk = require("./routes/barang_masuk.route");
const barang_keluar = require("./routes/barang_keluar.route");
const katalog_barang = require("./routes/katalog_barang.route");
const laporan = require("./routes/laporan.route");
const laporan_penjualan = require("./routes/laporan_penjualan.route");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Example routes
app.get("/", (req, res) => {
  res.send("API is running on Vercel!");
});
app.use('/barang_masuk', barang_masuk);
app.use('/barang_keluar', barang_keluar);
app.use('/katalog_barang', katalog_barang);
app.use('/laporan', laporan);
app.use('/laporan_penjualan', laporan_penjualan);
// Connect to MongoDB
mongoose
  .connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start the server (no need to specify port manually for Vercel)
module.exports = app;
