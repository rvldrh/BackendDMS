const express = require("express");
const router = express.Router();
const LaporanJadwalController = require("../controllers/laporanJadwal.controller");

router.post("/", LaporanJadwalController.createLaporan);
router.get("/", LaporanJadwalController.getAllLaporan);
router.get("/:id", LaporanJadwalController.getLaporanById);
router.put("/:id", LaporanJadwalController.updateLaporan);
router.put("/delete/:id", LaporanJadwalController.deleteLaporan);
router.put("/remark/:id", LaporanJadwalController.updateLaporanRemark);


module.exports = router;