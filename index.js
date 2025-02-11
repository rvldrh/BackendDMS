const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Import routes
const barang_masuk = require("./routes/barang_masuk.route");
const barang_keluar = require("./routes/barang_keluar.route");
const katalog_barang = require("./routes/katalog_barang.route");
const laporan = require("./routes/laporan.route");
const laporan_penjualan = require("./routes/laporan_penjualan.route");

// ✅ Allowed Origins (Domain yang diizinkan)
const allowedOrigins = [
  "https://dms-bms-frontend.vercel.app",
  "http://localhost:3000",
];

const allowCors = fn => async (req, res) => {
  if (allowedOrigins.includes(req.headers.origin)) {
    return Promise.resolve();
  } else if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // Jika tidak ada asal muasal yang diizinkan, lemparkan kesalahan dengan status 403
  const error = new Error('Not allowed by CORS');
  error.status = 403;
  throw error;
};

// 🔒 Middleware CORS dengan Validasi Dinamis
app.use(
  allowCors((req, res) => {
    // Validasi dinamis untuk memastikan bahwa permintaan berasal dari domain yang diizinkan
    if (allowedOrigins.includes(req.headers.origin)) {
      return Promise.resolve();
    } else if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Debugging: Log Database URL
console.log("DB_URL:", process.env.DB_URL);

// ✅ Routes
app.get("/", (req, res) => {
  res.send("API is running!");
});

app.use("/api/barang_masuk", barang_masuk);
app.use("/api/barang_keluar", barang_keluar);
app.use("/api/katalog_barang", katalog_barang);
app.use("/api/laporan", laporan);
app.use("/api/laporan_penjualan", laporan_penjualan);

// ✅ Middleware untuk menangani route yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// ✅ Koneksi MongoDB
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ✅ Jalankan Server
const PORT = process.env.PORT || 8008;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});