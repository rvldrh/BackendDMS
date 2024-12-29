const express = require("express");
const router = express.Router();
const controller = require("../controllers/lapora.controller");

router.post("/", controller.addLaporan);
router.get("/", controller.getLaporan);

module.exports = router;