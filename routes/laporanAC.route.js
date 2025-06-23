const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanAC.controller');
const upload = require('../middleware/upload');

router.get('/', laporanController.getAllLaporan);
router.post('/', upload.single('foto'), laporanController.addLaporan);
router.get('/:id', laporanController.getLaporanById);
router.patch('/:id', upload.single('foto'), laporanController.updateLaporan);
router.delete('/:id', laporanController.deleteLaporan);

module.exports = router;
