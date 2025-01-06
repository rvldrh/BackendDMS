const express = require("express");
const router = express.Router();
const controller = require("../controllers/katalog_barang.conroller");

router.get("/", controller.getKatalogBarang);
router.post("/", controller.addKatalogBarang);
router.get("/:id", controller.getKatalogBarangById);
router.put("/:id", controller.updateKatalogBarang);
router.delete("/:id", controller.deleteKatalogBarang);

module.exports = router;