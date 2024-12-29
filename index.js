require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
 
const DB_URL = process.env.DB_URL; // Ambil dari environment variable
const Schema = mongoose.Schema;
const bodyParser = require("body-parser");
const cors = require("cors");

const barang_masuk = require("./routes/barang_masuk.route");
const barang_keluar = require("./routes/barang_keluar.route");
const katalog_barang = require("./routes/katalog_barang.route");
const laporan = require("./routes/laporan.route");
const laporan_penjualan = require("./routes/laporan_penjualan.route");

// Middleware untuk parsing JSON
app.use(cors());
app.use(bodyParser.json());

app.use('/barang_masuk', barang_masuk);
app.use('/barang_keluar', barang_keluar);
app.use('/katalog_barang', katalog_barang);
app.use('/laporan', laporan);
app.use('/laporan_penjualan', laporan_penjualan);

// Koneksi ke MongoDB
mongoose
  .connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () =>
      console.log("Server running on http://localhost:3000")
    );
  })
  .catch((err) => console.error("Error connecting to MongoDB:", err));
