const express = require("express");
const router = express.Router();
const controller = require("../controllers/laporan_penjualan.controller");

router.get("/", controller.getLaporanPenjualan);
router.post("/", controller.addLaporanPenjualan);
router.get("/:id", controller.getLaporanPenjualanById);
router.put("/:id", controller.updateLaporanPenjualan);

module.exports = router;