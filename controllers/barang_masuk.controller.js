const { ModelBarang, ModelMasuk } = require("../models/main.model");

exports.addBarangMasuk =  async (req, res) => {
    try {
      const { tanggal, kode_barang, nama_barang, qty_masuk, keterangan } = req.body;
  
      // Validasi input
      if (!tanggal || !kode_barang || !nama_barang || !qty_masuk) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      // Simpan data barang masuk
      const newBarangMasuk = new ModelMasuk({
        tanggal,
        kode_barang,
        nama_barang,
        qty_masuk,
        keterangan,
      });
      await newBarangMasuk.save();
  
      // Update stok di katalog_barang
      const barang = await ModelBarang.findOne({ kode_barang });
      if (!barang) {
        return res.status(404).json({ message: `Barang dengan kode ${kode_barang} tidak ditemukan` });
      }
      barang.masuk += qty_masuk;
      barang.stok_akhir += qty_masuk;
      await barang.save();
  
      res.status(201).json({
        message: "Barang masuk berhasil ditambahkan dan stok diperbarui",
        data: newBarangMasuk,
      });
    } catch (err) {
      res.status(500).json({ message: "Error processing barang masuk", error: err.message });
    }
  }

  exports.getBarangMasuk = async (req, res) => {
    try {
      const barang_masuk = await ModelMasuk.find(); // Ambil semua produk dari database
      res.status(200).json({
        message: "barang_masuk retrieved successfully",
        data: barang_masuk,
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error retrieving barang_masuk", error: err.message });
    }
  }