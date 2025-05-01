const { ModelLaporanJadwal } = require("../models/main.model");

// 🔧 Helper untuk cari hari Sabtu dari minggu laporan
// Helper untuk mendapatkan Sabtu minggu lalu
// Helper untuk mendapatkan Sabtu minggu lalu
// 🔧 Helper untuk cari hari Sabtu pada minggu laporan (Sabtu yang relevan)
function getEndOfWeekSaturday(date) {
  const dayOfWeek = date.getDay(); // 0 = Minggu, 6 = Sabtu
  const daysUntilSaturday = 6 - dayOfWeek;
  const saturday = new Date(date);
  saturday.setDate(saturday.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);
  return saturday;
}

// 🔧 Helper untuk cari Sabtu minggu lalu
function getPreviousSaturday(date) {
  const dayOfWeek = date.getDay(); // 0 = Minggu, 6 = Sabtu
  const daysAgo = (dayOfWeek + 1); // Sabtu minggu lalu
  const saturdayLastWeek = new Date(date);
  saturdayLastWeek.setDate(saturdayLastWeek.getDate() - daysAgo);
  saturdayLastWeek.setHours(0, 0, 0, 0); // Set ke jam 00:00:00
  return saturdayLastWeek;
}


exports.createLaporan = async (req, res) => {
  try {
    const { tanggal, outlet, kpdm, remark, foto, topik_pembahasan } = req.body;

    // Validasi input
    if (!tanggal || !outlet || !kpdm || !topik_pembahasan) {
      return res
        .status(400)
        .json({ message: "Harap isi semua field yang diperlukan!" });
    }

    const tanggalDate = new Date(tanggal);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set ke hari ini jam 00:00:00

    // Mendapatkan Sabtu minggu ini
    const endOfWeekSaturday = getEndOfWeekSaturday(tanggalDate);

    // Mendapatkan Sabtu minggu lalu
    const previousSaturday = getPreviousSaturday(today);

    // Cek jika laporan sudah lewat dari Sabtu minggu lalu
    if (tanggalDate < previousSaturday) {
      return res.status(400).json({
        message: "Tidak bisa menambahkan laporan untuk tanggal sebelum Sabtu minggu lalu!",
      });
    }

    // Jika tanggal laporan sudah lewat dari Sabtu minggu ini
    if (today >= endOfWeekSaturday) {
      return res.status(400).json({
        message:
          "Tidak bisa menambahkan laporan karena minggu laporan sudah berakhir (melewati hari Sabtu).",
      });
    }

    // Soft delete laporan yang tanggalnya lebih lama dari Sabtu minggu lalu
    const oldLaporan = await ModelLaporanJadwal.find({
      tanggal: { $lt: previousSaturday },
      isDeleted: false,
    });

    if (oldLaporan.length > 0) {
      await ModelLaporanJadwal.updateMany(
        { _id: { $in: oldLaporan.map((laporan) => laporan._id) } },
        { $set: { isDeleted: true } }
      );
    }

    // Simpan laporan baru
    const newLaporan = new ModelLaporanJadwal({
      tanggal,
      outlet,
      kpdm,
      remark,
      foto,
      topik_pembahasan,
    });

    await newLaporan.save();

    const formattedData = {
      ...newLaporan._doc,
      tanggal: newLaporan.tanggal.toISOString().split("T")[0],
    };

    res
      .status(201)
      .json({ message: "Laporan berhasil ditambahkan", data: formattedData });
  } catch (error) {
    console.error("Error menambahkan laporan:", error);
    res.status(500).json({ message: "Terjadi kesalahan di server", error: error.message });
  }
};





// ✅ Ambil Semua Laporan Jadwal
// ✅ Ambil Semua Laporan Jadwal (yang tidak dihapus)
// ✅ Ambil Semua Laporan Jadwal (yang tidak dihapus)
// Auto update: Soft delete laporan yang sudah lewat (tanggal < hari ini)
// ✅ Ambil Semua Laporan Jadwal (yang tidak dihapus)
// Soft delete laporan yang sudah lewat dari Sabtu minggu lalu
exports.getAllLaporan = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set ke awal hari (jam 00:00:00)

    // Mendapatkan Sabtu minggu ini
    const endOfWeekSaturday = getEndOfWeekSaturday(today);

    // Mendapatkan Sabtu minggu lalu
    const previousSaturday = getPreviousSaturday(today);

    // Cari laporan yang tanggalnya lebih kecil dari Sabtu minggu lalu dan set isDeleted ke true
    const updatedLaporan = await ModelLaporanJadwal.updateMany(
      { tanggal: { $lt: previousSaturday }, isDeleted: false },
      { $set: { isDeleted: true } }
    );

    // Ambil hanya yang belum dihapus (isDeleted: false)
    const laporanList = await ModelLaporanJadwal.find({ isDeleted: false });

    // Format data agar tanggal dalam format YYYY-MM-DD
    const formattedList = laporanList.map((item) => ({
      ...item._doc,
      tanggal: item.tanggal.toISOString().split("T")[0],
    }));

    res.status(200).json({ status: "success", data: formattedList });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};



// ✅ Ambil Laporan Jadwal Berdasarkan ID
exports.getLaporanById = async (req, res) => {
  try {
    const { id } = req.params;
    const laporan = await ModelLaporanJadwal.findById(id);

    if (!laporan) {
      return res
        .status(404)
        .json({ status: "error", message: "Laporan tidak ditemukan" });
    }

    const formattedData = {
      ...laporan._doc,
      tanggal: laporan.tanggal.toISOString().split("T")[0],
    };

    res.status(200).json({ status: "success", data: formattedData });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ✅ Update Laporan Jadwal
exports.updateLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const laporan = await ModelLaporanJadwal.findById(id);
    if (!laporan) {
      return res
        .status(404)
        .json({ status: "error", message: "Laporan tidak ditemukan" });
    }

    const endOfWeekSaturday = getEndOfWeekSaturday(new Date(laporan.tanggal));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (today >= endOfWeekSaturday) {
      return res.status(400).json({
        message:
          "Tidak bisa mengedit laporan karena minggu laporan sudah berakhir (melewati hari Sabtu).",
      });
    }

    Object.assign(laporan, updateData);
    const updatedLaporan = await laporan.save();

    const formattedData = {
      ...updatedLaporan._doc,
      tanggal: updatedLaporan.tanggal.toISOString().split("T")[0],
    };

    res.status(200).json({ status: "success", data: formattedData });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ✅ Hapus Laporan Jadwal
// ✅ Soft Delete Laporan Jadwal
exports.deleteLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const laporan = await ModelLaporanJadwal.findById(id);

    if (!laporan) {
      return res
        .status(404)
        .json({ status: "error", message: "Laporan tidak ditemukan" });
    }

    laporan.isDeleted = true;
    await laporan.save();

    res
      .status(200)
      .json({ status: "success", message: "Laporan berhasil dihapus (soft delete)" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};


// ✅ Update Remark Laporan (hanya bisa sekali, dan sebelum Sabtu minggu laporan)
exports.updateLaporanRemark = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    if (!remark) {
      return res.status(400).json({ message: "Harap isi kolom remark!" });
    }

    const laporan = await ModelLaporanJadwal.findById(id);
    if (!laporan) {
      return res
        .status(404)
        .json({ status: "error", message: "Laporan tidak ditemukan" });
    }

    if (laporan.isRemarkUpdated) {
      return res
        .status(400)
        .json({ message: "Remark hanya bisa diubah sekali!" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const laporanDate = new Date(laporan.tanggal);
    const endOfWeekSaturday = getEndOfWeekSaturday(laporanDate);

    if (today >= endOfWeekSaturday) {
      return res.status(400).json({
        message:
          "Remark tidak bisa diedit karena minggu laporan sudah berakhir (melewati hari Sabtu).",
      });
    }

    const isSameDay =
      today.getFullYear() === laporanDate.getFullYear() &&
      today.getMonth() === laporanDate.getMonth() &&
      today.getDate() === laporanDate.getDate();

    if (!isSameDay) {
      return res.status(400).json({
        message:
          "Remark hanya bisa diedit pada tanggal yang sama dengan laporan!",
      });
    }

    laporan.remark = remark;
    laporan.isRemarkUpdated = true;

    const updatedLaporan = await laporan.save();

    const formattedData = {
      ...updatedLaporan._doc,
      tanggal: updatedLaporan.tanggal.toISOString().split("T")[0],
    };

    res.status(200).json({ status: "success", data: formattedData });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
