const { ModelLaporanPenjualan, ModelBarang } = require("../models/main.model");
const mongoose = require("mongoose");

exports.addLaporanPenjualan = async (req, res) => {
  try {
    const { tanggal, no_invoice, tgl_jatuhTempo, item, ppn } = req.body;

    if (
      !tanggal ||
      !no_invoice ||
      !tgl_jatuhTempo ||
      !item ||
      ppn === undefined
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let subtotal = 0;

      // Process each item to calculate its total and update stock
      for (const product of item) {
        const { _id, qty } = product;

        const barang = await ModelBarang.findById(_id).session(session);
        if (!barang) {
          throw new Error(`Barang dengan ID ${_id} tidak ditemukan.`);
        }

        // Calculate item total based on quantity and item price
        const itemTotal = barang.harga * qty;
        product.jumlah = itemTotal; // Automatically add the calculated total for the product
        subtotal += itemTotal; // Accumulate the subtotal

        // Update the stock of the item
        barang.keluar += qty;
        barang.stok_akhir -= qty;

        await barang.save({ session });
      }

      // Calculate the PPN (Value Added Tax)
      const ppnValue = subtotal * Number.parseFloat(ppn);
      const grand_total = subtotal + ppnValue;

      // Create a new Laporan Penjualan
      const newLaporanPenjualan = new ModelLaporanPenjualan({
        tanggal,
        no_invoice,
        tgl_jatuhTempo,
        item, // This item now includes the calculated 'jumlah' field
        ppn: Number.parseFloat(ppn),
        subtotal,
        grand_total,
      });

      // Save the new laporan penjualan
      await newLaporanPenjualan.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        message: "Laporan Penjualan created successfully",
        data: newLaporanPenjualan,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    res.status(500).json({
      message: "Error creating laporan penjualan",
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
    res
      .status(500)
      .json({
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
      .populate("item._id", "satuan harga stok_awal stok_akhir")
      .exec();

    if (!laporanPenjualan) {
      return res.status(404).json({ message: "Laporan Penjualan not found" });
    }

    res.status(200).json({
      message: "Laporan Penjualan retrieved successfully",
      data: laporanPenjualan,
    });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Error retrieving laporan penjualan",
        error: err.message,
      });
  }
};

exports.updateLaporanPenjualan = async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal, no_invoice, tgl_jatuhTempo, item, ppn } = req.body;

    if (
      !id ||
      !tanggal ||
      !no_invoice ||
      !tgl_jatuhTempo ||
      !item ||
      ppn === undefined
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

      // Rollback stock changes for the existing item data
      for (const oldItem of laporanPenjualan.item) {
        const { _id, qty } = oldItem;
        const barang = await ModelBarang.findById(_id).session(session);

        if (barang) {
          barang.keluar -= qty;
          barang.stok_akhir += qty;
          await barang.save({ session });
        }
      }

      // Process new item data
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

      // Update laporan penjualan
      laporanPenjualan.tanggal = tanggal;
      laporanPenjualan.no_invoice = no_invoice;
      laporanPenjualan.tgl_jatuhTempo = tgl_jatuhTempo;
      laporanPenjualan.item = item;
      laporanPenjualan.ppn = Number.parseFloat(ppn);
      laporanPenjualan.subtotal = subtotal;
      laporanPenjualan.grand_total = grand_total;

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
    res
      .status(500)
      .json({
        message: "Error updating laporan penjualan",
        error: err.message,
      });
  }
};
