const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // CORS package
require("dotenv").config(); // Load .env file

const app = express();

// Import routes
const barang_masuk = require("./routes/barang_masuk.route");
const barang_keluar = require("./routes/barang_keluar.route");
const katalog_barang = require("./routes/katalog_barang.route");
const laporan = require("./routes/laporan.route");
const laporan_penjualan = require("./routes/laporan_penjualan.route");

// Configure CORS with options
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization");
  next();
});

// Log DB_URL to check the environment variable
console.log("DB_URL:", process.env.DB_URL);

// Example routes
app.get("/", (req, res) => {
  res.send("API is running on port 8008!");
});

app.use("/barang_masuk", barang_masuk);
app.use("/barang_keluar", barang_keluar);
app.use("/katalog_barang", katalog_barang);
app.use("/laporan", laporan);
app.use("/laporan_penjualan", laporan_penjualan);

// Connect to MongoDB
mongoose
  .connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start the server
const PORT = process.env.PORT || 8008; // Default to 8008 if PORT is not set
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
