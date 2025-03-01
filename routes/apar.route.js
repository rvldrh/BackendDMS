const express = require("express");
const multer = require("multer");
const path = require("path");
const aparController = require("../controllers/apar.controller");

const router = express.Router();

// ✅ Konfigurasi Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "D:/vsc/DMS_PT_Berlian_Muda_Sukses/dmsfenext/public/img/apar");
  },
  filename: (req, file, cb) => {
    const fileName = "menu-image-" + Date.now() + path.extname(file.originalname);
    cb(null, fileName);
  },
});

const upload = multer({ storage });

// ✅ Rute API untuk APAR
router.post("/", upload.single("foto"), aparController.createAPAR); // Tambah APAR dengan foto
router.get("/", aparController.getAllAPAR); // Ambil Semua APAR
router.get("/:id", aparController.getAPARById); // Ambil APAR by ID
router.put("/:id", upload.single("foto"), aparController.updateAPAR); // Update APAR dengan foto baru
router.delete("/:id", aparController.deleteAPAR); // Hapus APAR

module.exports = router;
