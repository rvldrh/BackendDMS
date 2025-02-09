const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Import routes
const barang_masuk = require("./routes/barang_masuk.route");
const barang_keluar = require("./routes/barang_keluar.route");
const katalog_barang = require("./routes/katalog_barang.route");
const laporan = require("./routes/laporan.route");
const laporan_penjualan = require("./routes/laporan_penjualan.route");

// Allowed origins for CORS
const allowedOrigins = [
  "*"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log DB_URL to check the environment variable
console.log("DB_URL:", process.env.DB_URL);

// Example routes
app.get("/", (req, res) => {
  res.send("API is running!");
});

app.use("/barang_masuk", barang_masuk);
app.use("/barang_keluar", barang_keluar);
app.use("/katalog_barang", katalog_barang);
app.use("/laporan", laporan);
app.use("/laporan_penjualan", laporan_penjualan);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Connect to MongoDB 
mongoose
  .connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});