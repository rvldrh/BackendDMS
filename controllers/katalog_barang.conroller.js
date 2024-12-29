const { ModelBarang } = require("../models/main.model")

exports.getKatalogBarang = async (req, res) => {
    try {
      const katalog_barang = await ModelBarang.find()
          .populate('masuk', 'qty_masuk')
          .populate('keluar', 'qty_keluar')
          .exec();
      res.status(200).json({
        message: "katalog_barang retrieved successfully",
        data: katalog_barang,
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error retrieving katalog_barang", error: err.message });
    }
  }

  exports.addKatalogBarang = async (req, res) => {
    try {
      const {
        kode_barang,
        nama_barang,
        harga,
        satuan,
        stok_awal,
        masuk,
        keluar,
        stok_akhir,
      } = req.body;
  
      // Periksa apakah kode_barang sudah ada
      const existingBarang = await ModelBarang.findOne({ kode_barang });
      if (existingBarang) {
        return res.status(400).json({
          message: `Barang dengan kode_barang '${kode_barang}' sudah ada. Silakan gunakan kode_barang yang berbeda.`,
        });
      }
  
      // Buat dokumen baru
      const newProduct = new ModelBarang({
        kode_barang,
        nama_barang,
        harga,
        satuan,
        stok_awal,
        masuk,
        keluar,
        stok_akhir,
      });
  
      // Simpan ke database
      await newProduct.save();
      res
        .status(201)
        .json({ message: "Product successfully created", data: newProduct });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error creating product", error: err.message });
    }
  };
  