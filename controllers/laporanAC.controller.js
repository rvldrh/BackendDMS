const { ModelLaporanAC } = require('../models/main.model'); // ✅ Benar // Pastikan model sudah sesuai
const cloudinary = require('../utils/cloudinary');

// Ambil semua laporan
exports.getAllLaporan = async (req, res) => {
  try {
    const laporan = await ModelLaporanAC.find().sort({ tanggalPengerjaan: -1 });
    res.status(200).json(laporan);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data laporan', error: err.message });
  }
};

// Tambah laporan baru + upload ke Cloudinary
exports.addLaporan = async (req, res) => {
  try {
    const { tanggalPengerjaan, ruangan, status, hasil } = req.body;

    if (!req.file || !tanggalPengerjaan || !ruangan || !status ) {
      return res.status(400).json({ message: 'Semua field wajib diisi dan foto harus diunggah' });
    }

    // Upload ke Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'laporan-ac' },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      ).end(req.file.buffer);
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
    res.status(500).json({ message: 'Gagal menambahkan laporan', error: err.message });
  }
};

// Ambil satu laporan berdasarkan ID
exports.getLaporanById = async (req, res) => {
  try {
    const laporan = await ModelLaporanAC.findById(req.params.id);
    if (!laporan) return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    res.status(200).json(laporan);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil laporan', error: err.message });
  }
};

// Update laporan (tanpa ganti foto)

// Update hanya untuk field "hasil" dan hanya bisa dilakukan pada tanggalPengerjaan (hingga jam 23:59)
exports.updateLaporan = async (req, res) => {
  try {
    const { hasil } = req.body;

    if (!hasil) {
      return res.status(400).json({ message: 'Field "hasil" wajib diisi' });
    }

    const laporan = await ModelLaporanAC.findById(req.params.id);
    if (!laporan) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    const tanggalPengerjaan = new Date(laporan.tanggalPengerjaan);
    const sekarang = new Date();

    // Cek apakah tanggal hari ini sama dengan tanggal pengerjaan
    const sameDate =
      tanggalPengerjaan.getFullYear() === sekarang.getFullYear() &&
      tanggalPengerjaan.getMonth() === sekarang.getMonth() &&
      tanggalPengerjaan.getDate() === sekarang.getDate();

    if (!sameDate) {
      return res.status(403).json({
        message: 'Field "hasil" hanya bisa diubah pada tanggal pengerjaan',
      });
    }

    // Cek apakah waktu sekarang masih sebelum jam 12 malam
    const batasWaktu = new Date();
    batasWaktu.setHours(23, 59, 59, 999);

    if (sekarang > batasWaktu) {
      return res.status(403).json({
        message: 'Waktu untuk mengedit "hasil" telah berakhir (batas maksimal jam 23:59)',
      });
    }

    // Update hasil
    laporan.hasil = hasil;
    await laporan.save();

    res.status(200).json({ message: 'Hasil berhasil diupdate', data: laporan });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengupdate hasil laporan', error: err.message });
  }
};



// Hapus laporan
exports.deleteLaporan = async (req, res) => {
  try {
    const deleted = await ModelLaporanAC.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Laporan tidak ditemukan' });

    res.status(200).json({ message: 'Laporan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus laporan', error: err.message });
  }
};

