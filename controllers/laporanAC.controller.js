const { ModelLaporanAC } = require("../models/main.model"); // ✅ Benar // Pastikan model sudah sesuai
const cloudinary = require("../utils/cloudinary");

// Ambil semua laporan
exports.getAllLaporan = async (req, res) => {
  try {
    const laporan = await ModelLaporanAC.find().sort({ tanggalPengerjaan: -1 });
    res.status(200).json(laporan);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data laporan", error: err.message });
  }
};

// Tambah laporan baru + upload ke Cloudinary
exports.addLaporan = async (req, res) => {
  try {
    const { tanggalPengerjaan, ruangan, status, hasil } = req.body;

    if (!req.file || !tanggalPengerjaan || !ruangan || !status) {
      return res
        .status(400)
        .json({ message: "Semua field wajib diisi dan foto harus diunggah" });
    }

    // Upload ke Cloudinary
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


    const savedLaporan = await newLaporan.save();
    res.status(201).json(savedLaporan);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal menambahkan laporan", error: err.message });
  }
};

// Ambil satu laporan berdasarkan ID
exports.getLaporanById = async (req, res) => {
  try {
    const laporan = await ModelLaporanAC.findById(req.params.id);
    if (!laporan)
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    res.status(200).json(laporan);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengambil laporan", error: err.message });
  }
};

// Update laporan (tanpa ganti foto)

// Update hanya untuk field "hasil" dan hanya bisa dilakukan pada tanggalPengerjaan (hingga jam 23:59)
// PATCH laporan - hanya ruangan, status, hasil, dan foto yang bisa diubah
exports.updateLaporan = async (req, res) => {
  try {
    const { ruangan, status, hasil } = req.body;

    const laporan = await ModelLaporanAC.findById(req.params.id);
    if (!laporan) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    // Validasi minimal satu field diubah
    if (!ruangan && !status && !hasil && !req.file) {
      return res.status(400).json({
        message: "Setidaknya satu dari ruangan, status, hasil, atau foto harus diisi",
      });
    }

    // Update field jika ada
    if (ruangan) laporan.ruangan = ruangan;
    if (status) laporan.status = status;
    if (hasil) laporan.hasil = hasil;

    // Jika ada file foto baru
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "laporan-ac" }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          })
          .end(req.file.buffer);
      });

      laporan.foto = uploadResult.secure_url;
    }

    await laporan.save();

    res.status(200).json({
      message: "Laporan berhasil diupdate",
      data: laporan,
    });
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengupdate laporan",
      error: err.message,
    });
  }
};


// Hapus laporan
exports.deleteLaporan = async (req, res) => {
  try {
    const deleted = await ModelLaporanAC.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Laporan tidak ditemukan" });

    res.status(200).json({ message: "Laporan berhasil dihapus" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal menghapus laporan", error: err.message });
  }
};
