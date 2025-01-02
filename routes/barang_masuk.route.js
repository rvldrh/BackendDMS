const express = require("express");
const router = express.Router();
const controller = require("../controllers/barang_masuk.controller");

router.get("/", controller.getBarangMasuk);
router.post("/", controller.addBarangMasuk);
router.get("/:id", controller.getBarangMasukById);
router.put("/:id", controller.updateBarangMasuk);

module.exports = router;