const { ModelBarang, ModelMasuk } = require("../models/main.model");

exports.addBarangMasuk = async (req, res) => {
  try {
    const { tanggal, kode_barang, nama_barang, qty_masuk, keterangan } =
      req.body;

    if (!tanggal || !kode_barang || !nama_barang || !qty_masuk) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newBarangMasuk = new ModelMasuk({
      tanggal,
      kode_barang,
      nama_barang,
      qty_masuk,
      keterangan,
    });
    await newBarangMasuk.save();

    const barang = await ModelBarang.findOne({ kode_barang });
    if (!barang) {
      return res
        .status(404)
        .json({ message: `Barang dengan kode ${kode_barang} tidak ditemukan` });
    }
    barang.masuk += qty_masuk;
    barang.stok_akhir += qty_masuk;
    await barang.save();

    res.status(201).json({
      message: "Barang masuk berhasil ditambahkan dan stok diperbarui",
      data: newBarangMasuk,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error processing barang masuk", error: err.message });
  }
};

exports.getBarangMasuk = async (req, res) => {
  try {
    const barang_masuk = await ModelMasuk.find();
    res.status(200).json({
      message: "barang_masuk retrieved successfully",
      data: barang_masuk,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving barang_masuk", error: err.message });
  }
};
exports.getBarangMasukById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const barangMasuk = await ModelMasuk.findById(id);

    if (!barangMasuk) {
      return res.status(404).json({ message: "Barang masuk not found" });
    }

    res.status(200).json({
      message: "Barang masuk retrieved successfully",
      data: barangMasuk,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving barang masuk",
      error: err.message,
    });
  }
};
exports.updateBarangMasuk = async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal, kode_barang, nama_barang, qty_masuk, keterangan } =
      req.body;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const barangMasuk = await ModelMasuk.findById(id);
    if (!barangMasuk) {
      return res.status(404).json({ message: "Barang masuk not found" });
    }

    // If kode_barang is updated, ensure the stock adjustment is correct
    if (kode_barang && kode_barang !== barangMasuk.kode_barang) {
      const oldBarang = await ModelBarang.findOne({
        kode_barang: barangMasuk.kode_barang,
      });
      if (oldBarang) {
        oldBarang.masuk -= barangMasuk.qty_masuk;
        oldBarang.stok_akhir -= barangMasuk.qty_masuk;
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

      newBarang.masuk += qty_masuk || barangMasuk.qty_masuk;
      newBarang.stok_akhir += qty_masuk || barangMasuk.qty_masuk;
      await newBarang.save();
    } else if (qty_masuk && qty_masuk !== barangMasuk.qty_masuk) {
      const barang = await ModelBarang.findOne({
        kode_barang: barangMasuk.kode_barang,
      });
      if (barang) {
        barang.masuk += qty_masuk - barangMasuk.qty_masuk;
        barang.stok_akhir += qty_masuk - barangMasuk.qty_masuk;
        await barang.save();
      }
    }

    // Update fields
    if (tanggal !== undefined) barangMasuk.tanggal = tanggal;
    if (kode_barang !== undefined) barangMasuk.kode_barang = kode_barang;
    if (nama_barang !== undefined) barangMasuk.nama_barang = nama_barang;
    if (qty_masuk !== undefined) barangMasuk.qty_masuk = qty_masuk;
    if (keterangan !== undefined) barangMasuk.keterangan = keterangan;

    await barangMasuk.save();

    res.status(200).json({
      message: "Barang masuk successfully updated",
      data: barangMasuk,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating barang masuk",
      error: err.message,
    });
  }
};
