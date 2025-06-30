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

// POST Tambah Laporan Baru (sekali saja, tidak bisa edit)
// POST Tambah Laporan Baru (semua field wajib)
exports.addLaporan = async (req, res) => {
  try {
    const {
      tanggalPengerjaan,
      ruangan,
      status,
      hasil,
      teknisi,
    } = req.body;

    // Validasi semua field harus ada
    if (
      !tanggalPengerjaan ||
      !ruangan ||
      !status ||
      !hasil ||
      !teknisi ||
      !req.files?.fotoAwal ||
      !req.files?.fotoPengerjaan
    ) {
      return res.status(400).json({
        message:
          "Semua field wajib diisi: tanggalPengerjaan, ruangan, status, hasil, teknisi, fotoAwal, dan fotoPengerjaan",
      });
    }

    // Siapkan array hasil
    let hasilArray = [];

    // Kalau status 'Kerusakan' → hasil sebagai penjelasan kerusakan
    if (status === "Kerusakan") {
      hasilArray = [hasil];
    } else {
      // Tetap array meski hanya satu
      hasilArray = Array.isArray(hasil) ? hasil : [hasil];
    }

    // Upload fotoAwal ke Cloudinary
    const uploadFotoAwal = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "laporan-ac" },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      ).end(req.files.fotoAwal[0].buffer);
    });

    // Upload fotoPengerjaan ke Cloudinary
    const uploadFotoPengerjaan = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "laporan-ac" },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      ).end(req.files.fotoPengerjaan[0].buffer);
    });

    // Simpan ke database
    const newLaporan = new ModelLaporanAC({
      tanggalPengerjaan,
      ruangan,
      status,
      hasil: hasilArray,
      teknisi,
      fotoAwal: uploadFotoAwal.secure_url,
      fotoPengerjaan: uploadFotoPengerjaan.secure_url,
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

// ⚠️ Fitur update di-nonaktifkan
// PATCH Update Laporan
exports.updateLaporan = async (req, res) => {
  try {
    const { tanggalPengerjaan, ruangan, status, hasil, teknisi } = req.body;

    const laporan = await ModelLaporanAC.findById(req.params.id);
    if (!laporan) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    // Update field jika ada dan valid
    if (tanggalPengerjaan) laporan.tanggalPengerjaan = tanggalPengerjaan;
    if (ruangan) laporan.ruangan = ruangan;
    if (status) laporan.status = status;
    if (hasil) laporan.hasil = hasil;
    if (teknisi) laporan.teknisi = teknisi;

    // Update fotoAwal jika dikirim
    if (req.files?.fotoAwal) {
      const uploadFotoAwal = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "laporan-ac" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        ).end(req.files.fotoAwal[0].buffer);
      });
      laporan.fotoAwal = uploadFotoAwal.secure_url;
    }

    // Update fotoPengerjaan jika dikirim
    if (req.files?.fotoPengerjaan) {
      const uploadFotoPengerjaan = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "laporan-ac" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        ).end(req.files.fotoPengerjaan[0].buffer);
      });
      laporan.fotoPengerjaan = uploadFotoPengerjaan.secure_url;
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

exports.addHasilToLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const { hasil } = req.body;

    if (!hasil || typeof hasil !== "string") {
      return res.status(400).json({ message: "hasil harus berupa string" });
    }

    const laporan = await ModelLaporanAC.findById(id);
    if (!laporan) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    if (!Array.isArray(laporan.hasil)) {
      laporan.hasil = []; // 💡 fallback jika rusak
    }

    if (laporan.hasil.length >= 2) {
      return res.status(403).json({
        message: "Hasil hanya dapat ditambahkan maksimal satu kali setelah input awal.",
      });
    }

    laporan.hasil.push(hasil); // ✅ tambahkan string ke array
    laporan.lastAddedHasil = new Date();

    await laporan.save();

    res.status(200).json({
      message: "Hasil berhasil ditambahkan",
      data: laporan,
    });
  } catch (err) {
    console.error("Error addHasilToLaporan:", err);
    res.status(500).json({
      message: "Gagal menambahkan hasil",
      error: err.message,
    });
  }
};
