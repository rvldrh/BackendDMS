const { ModelLaporanAC } = require("../models/main.model");
const cloudinary = require("../utils/cloudinary");

// GET Semua Laporan
exports.getAllLaporan = async (req, res) => {
  try {
    const laporan = await ModelLaporanAC.find().sort({ tanggalPengerjaan: -1 });
    res.status(200).json(laporan);
  } catch (err) {
    console.error("Error getAllLaporan:", err);
    res.status(500).json({
      message: "Gagal mengambil data laporan",
      error: err.message,
    });
  }
};

// POST Tambah Laporan Baru
exports.addLaporan = async (req, res) => {
  try {
    const { tanggalPengerjaan, ruangan, status, hasil } = req.body;

    if (!tanggalPengerjaan || !ruangan || !status || !req.file) {
      return res.status(400).json({
        message:
          "Field tanggalPengerjaan, ruangan, status, dan foto wajib diisi",
      });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "laporan-ac" }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        })
        .end(req.file.buffer);
    });

    const newLaporan = new ModelLaporanAC({
      tanggalPengerjaan,
      ruangan,
      status,
      hasil,
      foto: uploadResult.secure_url,
    });

    const saved = await newLaporan.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error addLaporan:", err);
    res.status(500).json({
      message: "Gagal menambahkan laporan",
      error: err.message,
    });
  }
};

// GET Satu Laporan by ID
exports.getLaporanById = async (req, res) => {
  try {
    const laporan = await ModelLaporanAC.findById(req.params.id);
    if (!laporan) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }
    res.status(200).json(laporan);
  } catch (err) {
    console.error("Error getLaporanById:", err);
    res.status(500).json({
      message: "Gagal mengambil laporan",
      error: err.message,
    });
  }
};

// PATCH Update Laporan
exports.updateLaporan = async (req, res) => {
  try {
    const { ruangan, status, hasil } = req.body;

    const laporan = await ModelLaporanAC.findById(req.params.id);
    if (!laporan) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    // Update hanya jika value bertipe string dan tidak kosong
    if (typeof ruangan === "string" && ruangan.trim() !== "") {
      laporan.ruangan = ruangan;
    }

    if (typeof status === "string" && status.trim() !== "") {
      laporan.status = status;
    }

    if (typeof hasil === "string" && hasil.trim() !== "") {
      laporan.hasil = hasil;
    }

    // Cek dan update foto jika ada
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "laporan-ac" }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }).end(req.file.buffer);
      });
      laporan.foto = uploadResult.secure_url;
    }

    const updated = await laporan.save();
    res.status(200).json({
      message: "Laporan berhasil diupdate",
      data: updated,
    });
  } catch (err) {
    console.error("Error updateLaporan:", err);
    res.status(500).json({
      message: "Gagal mengupdate laporan",
      error: err.message,
    });
  }
};



// DELETE Hapus Laporan
exports.deleteLaporan = async (req, res) => {
  try {
    const deleted = await ModelLaporanAC.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    res.status(200).json({ message: "Laporan berhasil dihapus" });
  } catch (err) {
    console.error("Error deleteLaporan:", err);
    res.status(500).json({
      message: "Gagal menghapus laporan",
      error: err.message,
    });
  }
};
