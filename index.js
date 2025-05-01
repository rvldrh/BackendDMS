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
const apar = require("./routes/apar.route");
const laporanMarketing = require("./routes/laporanMarketing.route");
const laporanJadwal = require("./routes/laporanJadwal.route");

// ✅ Allowed Origins (Domain yang diizinkan)
const allowedOrigins = [
  "https://dms-bms-frontend.vercel.app",
  "http://localhost:3000",
];

// ✅ Middleware CORS dengan Validasi Dinamis
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin); // Debugging log
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
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
app.use("/api/apar", apar);
app.use("/api/laporan_marketing", laporanMarketing);
app.use("/api/laporan_jadwal", laporanJadwal);


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
