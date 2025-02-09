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

// Konfigurasi CORS agar hanya mengizinkan domain tertentu
const allowedOrigins = [
  "https://dms-bms-frontend.vercel.app",
  "http://localhost:3000",
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
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debugging: Log URL Database
console.log("DB_URL:", process.env.DB_URL);

// Routes
app.get("/", (req, res) => {
  res.send("API is running!");
});

app.use("/api/barang_masuk", barang_masuk);
app.use("/api/barang_keluar", barang_keluar);
app.use("/api/katalog_barang", katalog_barang);
app.use("/api/laporan", laporan);
app.use("/api/laporan_penjualan", laporan_penjualan);

// Middleware untuk menangani route yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Koneksi MongoDB
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Jalankan Server
const PORT = process.env.PORT || 8008;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
