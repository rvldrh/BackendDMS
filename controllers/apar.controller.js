const {ModelAPAR} = require("../models/main.model"); // Import model ModelAPAR

// ✅ Tambah ModelAPA

exports.createAPAR = async (req, res) => {
  try {
    const { jenis, nama_pemilik, tanggal_refill, tanggal_exp } = req.body;
    const foto = req.file ? `${req.file.filename}` : null; // Simpan path gambar

    // Validasi input
    if (!jenis || !nama_pemilik || !tanggal_refill || !tanggal_exp || !foto) {
      return res.status(400).json({ status: "error", message: "Semua field wajib diisi" });
    }

    const newAPAR = new ModelAPAR({
      jenis,
      nama_pemilik,
      tanggal_refill,
      tanggal_exp,
      foto,
    });

    await newAPAR.save();
    res.status(201).json({ status: "success", data: newAPAR });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};


// ✅ Ambil Semua ModelAPAR
exports.getAllAPAR = async (req, res) => {
  try {
    const aparList = await ModelAPAR.find();
    res.status(200).json({ status: "success", data: aparList });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ✅ Ambil ModelAPAR Berdasarkan ID
exports.getAPARById = async (req, res) => {
  try {
    const { id } = req.params;
    const apar = await ModelAPAR.findById(id);

    if (!apar) {
      return res.status(404).json({ status: "error", message: "ModelAPAR tidak ditemukan" });
    }

    res.status(200).json({ status: "success", data: apar });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ✅ Update ModelAPAR
exports.updateAPAR = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedAPAR = await ModelAPAR.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedAPAR) {
      return res.status(404).json({ status: "error", message: "ModelAPAR tidak ditemukan" });
    }

    res.status(200).json({ status: "success", data: updatedAPAR });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ✅ Hapus ModelAPAR
exports.deleteAPAR = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAPAR = await ModelAPAR.findByIdAndDelete(id);

    if (!deletedAPAR) {
      return res.status(404).json({ status: "error", message: "ModelAPAR tidak ditemukan" });
    }

    res.status(200).json({ status: "success", message: "ModelAPAR berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
