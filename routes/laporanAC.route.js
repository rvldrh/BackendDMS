const express = require("express");
const router = express.Router();
const laporanController = require("../controllers/laporanAC.controller");
const upload = require("../middleware/upload");

router.get("/", laporanController.getAllLaporan);
router.post(
  "/",
  upload.fields([
    { name: "fotoAwal", maxCount: 1 },
    { name: "fotoPengerjaan", maxCount: 1 },
  ]),
  laporanController.addLaporan
);

router.get("/:id", laporanController.getLaporanById);
router.delete("/:id", laporanController.deleteLaporan);
router.patch(
  "/:id",
  upload.fields([
    { name: "fotoAwal", maxCount: 1 },
    { name: "fotoPengerjaan", maxCount: 1 },
  ]),
  laporanController.updateLaporan
);
    
module.exports = router;
