const express = require("express");
const router = express.Router();
const controller = require("../controllers/laporan_penjualan.controller");

router.get("/", controller.getLaporanPenjualan);
router.post("/", controller.addLaporanPenjualan);

module.exports = router;