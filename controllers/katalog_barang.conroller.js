const { ModelBarang } = require("../models/main.model");

exports.getKatalogBarang = async (req, res) => {
  try {
    const katalog_barang = await ModelBarang.find()
      .populate("masuk", "qty_masuk")
      .populate("keluar", "qty_keluar")
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
};

exports.getKatalogBarangById = async (req, res) => {
  try {
    const katalog_barang = await ModelBarang.findById(req.params.id)
      .populate("masuk", "qty_masuk")
      .populate("keluar", "qty_keluar")
      .exec();
    if (!katalog_barang) {
      return res.status(404).json({ message: "katalog_barang not found" });
    }
    res.status(200).json({
      message: "katalog_barang retrieved successfully",
      data: katalog_barang,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving katalog_barang", error: err.message });
  }
};

exports.addKatalogBarang = async (req, res) => {
  try {
    const {
      kode_barang,
      nama_barang,
      harga,
      satuan,
      stok_awal,
    } = req.body;

    const stok_akhir = stok_awal;

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
      stok_akhir,
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
    if (masuk !== undefined) product.masuk = masuk;
    if (keluar !== undefined) product.keluar = keluar;
    if (stok_akhir !== undefined) product.stok_akhir = stok_akhir;

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
