const express = require("express");
const router = express.Router();
const controller = require("../controllers/laporan.controller");

router.post("/", controller.addLaporan);
router.get("/", controller.getLaporan);
router.get("/:id", controller.getLaporanById);
router.put("/:id", controller.updateLaporan);

module.exports = router;