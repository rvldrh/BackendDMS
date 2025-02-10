const { ModelLaporanPenjualan, ModelBarang } = require("../models/main.model");
const mongoose = require("mongoose");

exports.addLaporanPenjualan = async (req, res) => {
  try {
    const { tanggal, no_invoice, tgl_jatuhTempo, item, ppn, kepada } = req.body;

    // Validasi input
    if (
      !tanggal ||
      !no_invoice ||
      !tgl_jatuhTempo ||
      !Array.isArray(item) ||
      item.length === 0 ||
      ppn === undefined ||
      !kepada
    ) {
      return res.status(400).json({ message: "Missing or invalid required fields" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let subtotal = 0;
      const updatedItems = [];

      for (const product of item) {
        const { _id, qty } = product;

        if (!mongoose.Types.ObjectId.isValid(_id)) {
          throw new Error(`Invalid ObjectId: ${_id}`);
        }

        const barang = await ModelBarang.findById(_id).session(session);
        if (!barang) {
          throw new Error(`Barang dengan ID ${_id} tidak ditemukan.`);
        }

        const itemTotal = barang.harga * qty;
        subtotal += itemTotal;

        barang.keluar += qty;
        barang.stok_akhir -= qty;
        await barang.save({ session });

        // Simpan item yang diperbarui ke dalam array baru
        updatedItems.push({
          _id: barang._id, // Gunakan ID barang yang valid
          qty: qty,
          jumlah: itemTotal,
        });
      }

      const ppnValue = subtotal * Number.parseFloat(ppn);
      const grand_total = subtotal + ppnValue;

      const newLaporanPenjualan = new ModelLaporanPenjualan({
        tanggal,
        no_invoice,
        tgl_jatuhTempo,
        item: updatedItems, // Gunakan item yang sudah diperbarui
        ppn: Number.parseFloat(ppn),
        subtotal,
        grand_total,
        kepada,
      });

      const savedLaporan = await newLaporanPenjualan.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        message: "Laporan Penjualan created successfully",
        data: savedLaporan,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transaction error:", err.message);
      res.status(400).json({
        message: "Error processing laporan penjualan",
        error: err.message,
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "Server error while creating laporan penjualan",
      error: err.message,
    });
  }
};

exports.getLaporanPenjualan = async (req, res) => {
  try {
    const laporan_penjualan = await ModelLaporanPenjualan.find()
      .populate("item._id", "satuan harga stok_awal stok_akhir")
      .exec();

    res.status(200).json({
      message: "laporan_penjualan retrieved successfully",
      data: laporan_penjualan,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving laporan_penjualan",
      error: err.message,
    });
  }
};

exports.getLaporanPenjualanById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID parameter is required" });
    }

    const laporanPenjualan = await ModelLaporanPenjualan.findById(id)
      .populate("item._id", "nama_barang satuan harga stok_awal stok_akhir")
      .exec();

    if (!laporanPenjualan) {
      return res.status(404).json({ message: "Laporan Penjualan not found" });
    }

    res.status(200).json({
      message: "Laporan Penjualan retrieved successfully",
      data: laporanPenjualan,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving laporan penjualan",
      error: err.message,
    });
  }
};

exports.updateLaporanPenjualan = async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal, no_invoice, tgl_jatuhTempo, item, ppn, kepada } = req.body;

    if (
      !id ||
      !tanggal ||
      !no_invoice ||
      !tgl_jatuhTempo ||
      !item ||
      ppn === undefined ||
      !kepada
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const laporanPenjualan = await ModelLaporanPenjualan.findById(id).session(
        session
      );

      if (!laporanPenjualan) {
        return res.status(404).json({ message: "Laporan Penjualan not found" });
      }

      for (const oldItem of laporanPenjualan.item) {
        const { _id, qty } = oldItem;
        const barang = await ModelBarang.findById(_id).session(session);

        if (barang) {
          barang.keluar -= qty;
          barang.stok_akhir += qty;
          await barang.save({ session });
        }
      }

      let subtotal = 0;
      for (const product of item) {
        const { _id, qty } = product;

        const barang = await ModelBarang.findById(_id).session(session);
        if (!barang) {
          throw new Error(`Barang dengan ID ${_id} tidak ditemukan.`);
        }

        const itemTotal = barang.harga * qty;
        product.total = itemTotal;
        subtotal += itemTotal;

        barang.keluar += qty;
        barang.stok_akhir -= qty;
        await barang.save({ session });
      }

      const ppnValue = subtotal * Number.parseFloat(ppn);
      const grand_total = subtotal + ppnValue;

      laporanPenjualan.tanggal = tanggal;
      laporanPenjualan.no_invoice = no_invoice;
      laporanPenjualan.tgl_jatuhTempo = tgl_jatuhTempo;
      laporanPenjualan.item = item;
      laporanPenjualan.ppn = Number.parseFloat(ppn);
      laporanPenjualan.subtotal = subtotal;
      laporanPenjualan.grand_total = grand_total;
      laporanPenjualan.kepada = kepada; // Update field kepada

      await laporanPenjualan.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        message: "Laporan Penjualan updated successfully",
        data: laporanPenjualan,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    res.status(500).json({
      message: "Error updating laporan penjualan",
      error: err.message,
    });
  }
};
