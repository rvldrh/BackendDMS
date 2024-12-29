const { ModelBarang,ModelKeluar } = require("../models/main.model")

exports.addBarangKeluar = async (req, res) => {
    try {
      const { tanggal, kode_barang, nama_barang, qty_keluar, keterangan } = req.body;
  
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
        return res.status(404).json({ message: `Barang dengan kode ${kode_barang} tidak ditemukan` });
      }
  
      if (barang.stok_akhir < qty_keluar) {
        return res.status(400).json({ message: "Stok tidak mencukupi untuk barang keluar" });
      }
  
      barang.keluar += qty_keluar;
      barang.stok_akhir -= qty_keluar;
      await barang.save();
  
      res.status(201).json({
        message: "Barang keluar berhasil ditambahkan dan stok diperbarui",
        data: newBarangKeluar,
      });
    } catch (err) {
      res.status(500).json({ message: "Error processing barang keluar", error: err.message });
    }
  }

  exports.getBarangKeluar = async (req, res) => {
    try {
      const barang_keluar = await ModelKeluar.find(); // Ambil semua produk dari database
      res.status(200).json({
        message: "barang_keluar retrieved successfully",
        data: barang_keluar,
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error retrieving barang_keluar", error: err.message });
    }
  }