const { ModelLaporanMarketing } = require("../models/main.model");

// Get all reports
exports.getAllLaporan = async (req, res) => {
  try {
    const laporan = await ModelLaporanMarketing.find();
    res.status(200).json(laporan);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data laporan", error: error.message });
  }
};

// Get a single report by ID
exports.getLaporanById = async (req, res) => {
  try {
    const laporan = await ModelLaporanMarketing.findById(req.params.id);
    if (!laporan) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }
    res.status(200).json(laporan);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil laporan", error });
  }
};

// Create a new report
exports.createLaporan = async (req, res) => {
  try {
    const { hari, marketing, rencana, tujuan, remark } = req.body;

    const newLaporan = new ModelLaporanMarketing({
      hari,
      marketing,
      rencana,
      tujuan,
      remark,
    });

    await newLaporan.save();
    res.status(201).json({ message: "Laporan berhasil dibuat", newLaporan });
  } catch (error) {
    res.status(500).json({ message: "Gagal membuat laporan", error });
  }
};

// Update a report
exports.updateLaporan = async (req, res) => {
  try {
    const { hari, marketing, rencana, tujuan, remark } = req.body;

    const updatedLaporan = await ModelLaporanMarketing.findByIdAndUpdate(
      req.params.id,
      { hari, marketing, rencana, tujuan, remark },
      { new: true }
    );

    if (!updatedLaporan) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    res.status(200).json({ message: "Laporan berhasil diperbarui", updatedLaporan });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui laporan", error });
  }
};

// Delete a report
exports.deleteLaporan = async (req, res) => {
  try {
    const laporan = await ModelLaporanMarketing.findByIdAndDelete(req.params.id);
    if (!laporan) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    res.status(200).json({ message: "Laporan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus laporan", error });
  }
};
