const express = require("express");
const router = express.Router();
const laporanMarketingController = require("../controllers/laporanMarketing.controller");

// Routes
router.get("/", laporanMarketingController.getAllLaporan);
router.get("/:id", laporanMarketingController.getLaporanById);
router.post("/", laporanMarketingController.createLaporan);
router.patch("/:id", laporanMarketingController.updateLaporan);
router.delete("/:id", laporanMarketingController.deleteLaporan);

module.exports = router;
