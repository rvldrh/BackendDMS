const { ModelBarang } = require("../models/main.model");

// Get all barang with calculated stok_akhir
exports.getKatalogBarang = async (req, res) => {
  try {
    const katalog_barang = await ModelBarang.find()
      .populate("masuk", "qty_masuk")
      .populate("keluar", "qty_keluar")
      .exec();

    // Calculate stok_akhir for each item
    const katalogWithStokAkhir = katalog_barang.map((item) => {
      const qtyMasuk = item.masuk?.qty_masuk || 0;
      const qtyKeluar = item.keluar?.qty_keluar || 0;
      const stokAkhir = item.stok_awal + qtyMasuk - qtyKeluar;
      return { ...item._doc, stok_akhir: stokAkhir };
    });

    res.status(200).json({
      message: "katalog_barang retrieved successfully",
      data: katalogWithStokAkhir,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving katalog_barang", error: err.message });
  }
};

// Get barang by ID with calculated stok_akhir
exports.getKatalogBarangById = async (req, res) => {
  try {
    const katalog_barang = await ModelBarang.findById(req.params.id)
      .populate("masuk", "qty_masuk")
      .populate("keluar", "qty_keluar")
      .exec();

    if (!katalog_barang) {
      return res.status(404).json({ message: "katalog_barang not found" });
    }

    // Calculate stok_akhir
    const qtyMasuk = katalog_barang.masuk?.qty_masuk || 0;
    const qtyKeluar = katalog_barang.keluar?.qty_keluar || 0;
    const stokAkhir = katalog_barang.stok_awal + qtyMasuk - qtyKeluar;

    res.status(200).json({
      message: "katalog_barang retrieved successfully",
      data: { ...katalog_barang._doc, stok_akhir: stokAkhir },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving katalog_barang", error: err.message });
  }
};

// Add barang with calculated stok_akhir
exports.addKatalogBarang = async (req, res) => {
  try {
    const { kode_barang, nama_barang, harga, satuan, stok_awal } = req.body;

    const stok_akhir = stok_awal; // Initial stok_akhir equals stok_awal

    // Check if kode_barang already exists
    const existingBarang = await ModelBarang.findOne({ kode_barang });
    if (existingBarang) {
      return res.status(400).json({
        message: `Barang dengan kode_barang '${kode_barang}' sudah ada. Silakan gunakan kode_barang yang berbeda.`,
      });
    }

    const newProduct = new ModelBarang({
      kode_barang,
      nama_barang,
      harga,
      satuan,
      stok_awal,
      stok_akhir,
    });

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

// Update barang with calculated stok_akhir
exports.updateKatalogBarang = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kode_barang,
      nama_barang,
      harga,
      satuan,
      stok_awal,
      masuk,
      keluar,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    // Check if the kode_barang already exists for another product
    if (kode_barang) {
      const existingBarang = await ModelBarang.findOne({
        kode_barang,
        _id: { $ne: id },
      });
      if (existingBarang) {
        return res.status(400).json({
          message: `Barang dengan kode_barang '${kode_barang}' sudah ada. Silakan gunakan kode_barang yang berbeda.`,
        });
      }
    }

    const product = await ModelBarang.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Barang not found" });
    }

    // Update fields
    if (kode_barang !== undefined) product.kode_barang = kode_barang;
    if (nama_barang !== undefined) product.nama_barang = nama_barang;
    if (harga !== undefined) product.harga = harga;
    if (satuan !== undefined) product.satuan = satuan;
    if (stok_awal !== undefined) product.stok_awal = stok_awal;

    // Calculate stok_akhir before saving
    const qtyMasuk = masuk || product.masuk || 0;
    const qtyKeluar = keluar || product.keluar || 0;
    product.stok_akhir = (stok_awal || product.stok_awal) + qtyMasuk - qtyKeluar;

    await product.save();

    res.status(200).json({
      message: "Product successfully updated",
      data: product,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating product",
      error: err.message,
    });
  }
};

// Delete barang
exports.deleteKatalogBarang = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const product = await ModelBarang.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product successfully deleted" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting product",
      error: err.message,
    });
  }
};
