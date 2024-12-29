const express = require("express");
const router = express.Router();
const controller = require("../controllers/katalog_barang.conroller");

router.get("/", controller.getKatalogBarang);
router.post("/", controller.addKatalogBarang);

module.exports = router;