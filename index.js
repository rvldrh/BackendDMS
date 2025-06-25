const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Allowed Origins
const allowedOrigins = [
  "https://dms-bms-frontend.vercel.app",
  "http://localhost:3000",
];

// ✅ Middleware CORS Dinamis
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         console.log("Blocked by CORS:", origin);
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//     optionsSuccessStatus: 200,
//   })
// );

// ✅ Tangani Preflight (OPTIONS) Secara Global
app.options("*", cors());

// ✅ Header Manual Tambahan (untuk keamanan ekstra CORS)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// ✅ Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Log koneksi DB
console.log("DB_URL:", process.env.DB_URL);

// ✅ Import route
const barang_masuk = require("./routes/barang_masuk.route");
const barang_keluar = require("./routes/barang_keluar.route");
const katalog_barang = require("./routes/katalog_barang.route");
const laporan = require("./routes/laporan.route");
const laporan_penjualan = require("./routes/laporan_penjualan.route");
const apar = require("./routes/apar.route");
const laporanMarketing = require("./routes/laporanMarketing.route");
const laporanJadwal = require("./routes/laporanJadwal.route");
const laporanAC = require("./routes/laporanAC.route");

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
app.use("/api/laporan_AC", laporanAC); // ✅ penting! pastikan ini sudah include PATCH

// ✅ Middleware 404
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
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Jalankan Server
const PORT = process.env.PORT || 8008;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
