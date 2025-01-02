const { ModelBarang, ModelKeluar } = require("../models/main.model");

exports.addBarangKeluar = async (req, res) => {
  try {
    const { tanggal, kode_barang, nama_barang, qty_keluar, keterangan } =
      req.body;

    if (!tanggal || !kode_barang || !nama_barang || !qty_keluar) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newBarangKeluar = new ModelKeluar({
      tanggal,
      kode_barang,
      nama_barang,
      qty_keluar,
      keterangan,
    });
    await newBarangKeluar.save();

    const barang = await ModelBarang.findOne({ kode_barang });
    if (!barang) {
      return res
        .status(404)
        .json({ message: `Barang dengan kode ${kode_barang} tidak ditemukan` });
    }

    if (barang.stok_akhir < qty_keluar) {
      return res
        .status(400)
        .json({ message: "Stok tidak mencukupi untuk barang keluar" });
    }

    barang.keluar += qty_keluar;
    barang.stok_akhir -= qty_keluar;
    await barang.save();

    res.status(201).json({
      message: "Barang keluar berhasil ditambahkan dan stok diperbarui",
      data: newBarangKeluar,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error processing barang keluar", error: err.message });
  }
};

exports.getBarangKeluar = async (req, res) => {
  try {
    const barang_keluar = await ModelKeluar.find();
    res.status(200).json({
      message: "barang_keluar retrieved successfully",
      data: barang_keluar,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving barang_keluar", error: err.message });
  }
};
exports.getBarangKeluarById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const barangKeluar = await ModelKeluar.findById(id);

    if (!barangKeluar) {
      return res.status(404).json({ message: "Barang keluar not found" });
    }

    res.status(200).json({
      message: "Barang keluar retrieved successfully",
      data: barangKeluar,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving barang keluar",
      error: err.message,
    });
  }
};
exports.updateBarangKeluar = async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal, kode_barang, nama_barang, qty_keluar, keterangan } =
      req.body;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const barangKeluar = await ModelKeluar.findById(id);
    if (!barangKeluar) {
      return res.status(404).json({ message: "Barang keluar not found" });
    }

    const barang = await ModelBarang.findOne({
      kode_barang: barangKeluar.kode_barang,
    });
    if (!barang) {
      return res
        .status(404)
        .json({
          message: `Barang dengan kode ${barangKeluar.kode_barang} tidak ditemukan`,
        });
    }

    // Adjust stock if `kode_barang` or `qty_keluar` is updated
    if (kode_barang && kode_barang !== barangKeluar.kode_barang) {
      const oldBarang = await ModelBarang.findOne({
        kode_barang: barangKeluar.kode_barang,
      });
      if (oldBarang) {
        oldBarang.keluar -= barangKeluar.qty_keluar;
        oldBarang.stok_akhir += barangKeluar.qty_keluar;
        await oldBarang.save();
      }

      const newBarang = await ModelBarang.findOne({ kode_barang });
      if (!newBarang) {
        return res
          .status(404)
          .json({
            message: `Barang dengan kode ${kode_barang} tidak ditemukan`,
          });
      }

      if (newBarang.stok_akhir < (qty_keluar || barangKeluar.qty_keluar)) {
        return res
          .status(400)
          .json({ message: "Stok tidak mencukupi untuk barang keluar" });
      }

      newBarang.keluar += qty_keluar || barangKeluar.qty_keluar;
      newBarang.stok_akhir -= qty_keluar || barangKeluar.qty_keluar;
      await newBarang.save();
    } else if (qty_keluar && qty_keluar !== barangKeluar.qty_keluar) {
      if (barang.stok_akhir + barangKeluar.qty_keluar < qty_keluar) {
        return res
          .status(400)
          .json({ message: "Stok tidak mencukupi untuk barang keluar" });
      }

      barang.keluar += qty_keluar - barangKeluar.qty_keluar;
      barang.stok_akhir -= qty_keluar - barangKeluar.qty_keluar;
      await barang.save();
    }

    // Update fields
    if (tanggal !== undefined) barangKeluar.tanggal = tanggal;
    if (kode_barang !== undefined) barangKeluar.kode_barang = kode_barang;
    if (nama_barang !== undefined) barangKeluar.nama_barang = nama_barang;
    if (qty_keluar !== undefined) barangKeluar.qty_keluar = qty_keluar;
    if (keterangan !== undefined) barangKeluar.keterangan = keterangan;

    await barangKeluar.save();

    res.status(200).json({
      message: "Barang keluar successfully updated",
      data: barangKeluar,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating barang keluar",
      error: err.message,
    });
  }
};
