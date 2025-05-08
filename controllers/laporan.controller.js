const { ModelLaporan, ModelBarang, ModelMasuk } = require("../models/main.model");
const mongoose = require("mongoose");

exports.addLaporan = async (req, res) => {
  try {
    const {
      tgl_transaksi,
      supplier,
      barang,
      ongkir,
      discount,
      status,
      tgl_pelunasan,
      keterangan,
    } = req.body;

    // Parsing angka
    const parsedOngkir = Number(ongkir);
    const parsedDiscount = Number(discount);

    // Validasi
    if (
      !tgl_transaksi ||
      !supplier ||
      !Array.isArray(barang) || barang.length === 0 ||
      isNaN(parsedOngkir) ||
      isNaN(parsedDiscount) ||
      !status ||
      !tgl_pelunasan ||
      !keterangan
    ) {
      return res.status(400).json({ message: "Missing or invalid required fields" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let total = 0;

      for (const item of barang) {
        const { _id, vol } = item;
        const volume = Number(vol);

        const product = await ModelBarang.findById(_id).session(session);
        if (!product) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: `Barang dengan ID ${_id} tidak ditemukan.` });
        }

        const itemTotal = product.harga * volume;
        item.total = itemTotal;
        total += itemTotal;

        // Update stok barang
        product.masuk += volume;
        product.stok_akhir = product.stok_awal + product.masuk - product.keluar;

        await product.save({ session });
      }

      const discountValue = total * parsedDiscount;
      const grand_total = total - discountValue + parsedOngkir;

      const newLaporan = new ModelLaporan({
        tgl_transaksi,
        supplier,
        barang,
        ongkir: parsedOngkir,
        discount: parsedDiscount,
        grand_total,
        total,
        status,
        tgl_pelunasan,
        keterangan,
      });

      await newLaporan.save({ session });

      // Tambahkan data ke model BarangMasuk
      for (const item of barang) {
        const product = await ModelBarang.findById(item._id).session(session);

        const barangMasuk = new ModelMasuk({
          tanggal: tgl_transaksi,
          kode_barang: product.kode_barang,
          nama_barang: product.nama_barang,
          qty_masuk: item.vol,
          keterangan: keterangan,
        });

        await barangMasuk.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        message: "Laporan created successfully, stock updated, and barang masuk recorded",
        data: newLaporan,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error(err);
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};


exports.getLaporan = async (req, res) => {
  try {
    const laporan = await ModelLaporan.find()
      .populate("barang._id", "satuan stok_awal stok_akhir harga")
      .exec();

    res.status(200).json({
      message: "laporan retrieved successfully",
      data: laporan,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving laporan", error: err.message });
  }
};

exports.getLaporanById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const laporan = await ModelLaporan.findById(id)
      .populate("barang._id", "satuan stok_awal stok_akhir harga")
      .exec();

    if (!laporan) {
      return res.status(404).json({ message: "Laporan not found" });
    }

    res.status(200).json({
      message: "Laporan retrieved successfully",
      data: laporan,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving laporan",
      error: err.message,
    });
  }
};
exports.updateLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tgl_transaksi,
      supplier,
      barang,
      ongkir,
      discount,
      status,
      tgl_pelunasan,
      keterangan,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    if (
      !tgl_transaksi ||
      !supplier ||
      !barang ||
      !ongkir ||
      discount === undefined ||
      !status ||
      !tgl_pelunasan ||
      !keterangan
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const laporan = await ModelLaporan.findById(id).session(session);

      if (!laporan) {
        throw new Error(`Laporan with ID ${id} not found`);
      }

      let total = 0;

      for (const item of barang) {
        const { _id, vol } = item;

        const product = await ModelBarang.findById(_id).session(session);
        if (!product) {
          throw new Error(`Barang with ID ${_id} not found.`);
        }

        // Adjust stock based on previous volume in laporan
        const prevItem = laporan.barang.find(
          (prev) => prev._id.toString() === _id
        );
        if (prevItem) {
          product.masuk -= prevItem.vol; // Revert previous stock changes
          product.stok_akhir =
            product.stok_awal + product.masuk - product.keluar;
        }

        // Update stock with new volume
        product.masuk += vol;
        product.stok_akhir = product.stok_awal + product.masuk - product.keluar;

        const itemTotal = product.harga * vol;
        item.total = itemTotal;
        total += itemTotal;

        await product.save({ session });
      }

      const discountValue = total * Number.parseFloat(discount);
      const grand_total = total - discountValue + ongkir;

      // Update laporan fields
      laporan.tgl_transaksi = tgl_transaksi;
      laporan.supplier = supplier;
      laporan.barang = barang;
      laporan.ongkir = ongkir;
      laporan.discount = Number.parseFloat(discount);
      laporan.grand_total = grand_total;
      laporan.total = total;
      laporan.status = status;
      laporan.tgl_pelunasan = tgl_pelunasan;
      laporan.keterangan = keterangan;

      await laporan.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        message: "Laporan updated successfully and stock adjusted",
        data: laporan,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    res.status(500).json({
      message: "Error updating laporan",
      error: err.message,
    });
  }
};
