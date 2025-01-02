const express = require("express");
const router = express.Router();
const controller = require("../controllers/barang_keluar.controller");

router.get("/", controller.getBarangKeluar);
router.post("/", controller.addBarangKeluar);
router.get("/:id", controller.getBarangKeluarById);
router.put("/:id", controller.updateBarangKeluar);

module.exports = router;