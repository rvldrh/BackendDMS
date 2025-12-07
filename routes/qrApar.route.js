const express = require("express");
const router = express.Router();
const qrAparController = require("../controllers/qrApar.controller");
const upload = require("../middleware/upload");

router.get("/", qrAparController.getAllQrApar);
router.post(
  "/",
  upload.fields(
    {
      name: "fotoQr",
      maxCount: 1,
    }
  ),
  qrAparController.createQrApar
);
router.get("/:id", qrAparController.getQrAparById);

module.exports = router;
