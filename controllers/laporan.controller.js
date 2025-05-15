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
    const PPN_RATE = 0.11; // Fixed 11% PPN

    // Validasi
    if (
      !tgl_transaksi ||
      !supplier ||
      !Array.isArray(barang) ||
      barang.length === 0 ||
      isNaN(parsedOngkir) ||
      isNaN(parsedDiscount) ||
      !status ||
      !tgl_pelunasan ||
      !keterangan
    ) {
      return res.status(400).json({ message: "Missing or invalid required fields" });
    }

    // Validasi tambahan: setiap item barang harus menyertakan _id, harga, dan vol
    for (const item of barang) {
      if (
        !item._id ||
        !Number.isFinite(item.vol) || item.vol <= 0 ||
        !Number.isFinite(item.harga) || item.harga <= 0
      ) {
        return res.status(400).json({ message: "Each barang item must include valid _id, vol (positive number), and harga (positive number)" });
      }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let total = 0;

      for (const item of barang) {
        const { _id, vol, harga } = item;
        const volume = Number(vol);

        const product = await ModelBarang.findById(_id).session(session);
        if (!product) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: `Barang dengan ID ${_id} tidak ditemukan.` });
        }

        // Tambahkan entri harga baru ke array harga di ModelBarang
        product.harga.push({
          tgl_beli: new Date(tgl_transaksi),
          harga: Number(harga),
          sisa_qty: volume,
        });

        // Urutkan array harga berdasarkan tgl_beli (ascending)
        product.harga.sort((a, b) => a.tgl_beli - b.tgl_beli);

        // Update stok barang
        product.masuk += volume;
        product.stok_akhir = product.stok_awal + product.masuk - product.keluar;

        // Hitung total untuk item ini (termasuk PPN)
        const itemSubtotal = harga * volume;
        const itemTotal = itemSubtotal * (1 + PPN_RATE);
        item.total = itemTotal;
        total += itemTotal;

        await product.save({ session });
      }

      const discountValue = total * parsedDiscount;
      const grand_total = total - discountValue + parsedOngkir;

      const newLaporan = new ModelLaporan({
        tgl_transaksi,
        supplier,
        barang,
        ongkir: parsedOngkir,
        ppn: PPN_RATE, // Set fixed PPN rate
        discount: parsedDiscount,
        grand_total,
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
          harga_satuan: Number(item.harga),
        });

        await barangMasuk.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        message: "Laporan created successfully, stock, harga, sisa_qty, and barang masuk updated",
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
      .populate("barang._id", "nama_barang satuan stok_awal stok_akhir harga")
      .exec();

    res.status(200).json({
      message: "Laporan retrieved successfully",
      data: laporan,
    });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving laporan", error: err.message });
  }
};

exports.getLaporanById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const laporan = await ModelLaporan.findById(id)
      .populate("barang._id", "nama_barang satuan stok_awal stok_akhir harga")
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

    const PPN_RATE = 0.11; // Fixed 11% PPN

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    if (
      !tgl_transaksi ||
      !supplier ||
      !Array.isArray(barang) ||
      barang.length === 0 ||
      !Number.isFinite(ongkir) ||
      !Number.isFinite(discount) ||
      !status ||
      !tgl_pelunasan ||
      !keterangan
    ) {
      return res.status(400).json({ message: "Missing or invalid required fields" });
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
        const { _id, vol, harga } = item;
        const volume = Number(vol);

        const product = await ModelBarang.findById(_id).session(session);
        if (!product) {
          throw new Error(`Barang with ID ${_id} not found.`);
        }

        // Adjust stock based on previous volume in laporan
        const prevItem = laporan.barang.find(
          (prev) => prev._id.toString() === _id.toString()
        );
        if (prevItem) {
          product.masuk -= prevItem.vol; // Revert previous stock
          product.stok_akhir = product.stok_awal + product.masuk - product.keluar;
        }

        // Update stock with new volume
        product.masuk += volume;
        product.stok_akhir = product.stok_awal + product.masuk - product.keluar;

        // Hitung total untuk item ini (termasuk PPN)
        const itemSubtotal = harga * volume;
        const itemTotal = itemSubtotal * (1 + PPN_RATE);
        item.total = itemTotal;
        total += itemTotal;

        await product.save({ session });
      }

      const discountValue = total * Number.parseFloat(discount);
      const grand_total = total - discountValue + Number.parseFloat(ongkir);

      // Update laporan fields
      laporan.tgl_transaksi = tgl_transaksi;
      laporan.supplier = supplier;
      laporan.barang = barang;
      laporan.ongkir = Number.parseFloat(ongkir);
      laporan.ppn = PPN_RATE;
      laporan.discount = Number.parseFloat(discount);
      laporan.grand_total = grand_total;
      laporan.status = status;
      laporan.tgl_pelunasan = tgl_pelunasan;
      laporan.keterangan = keterangan;

      await laporan.save({ session });

      // Update BarangMasuk
      await ModelMasuk.deleteMany({ tanggal: laporan.tgl_transaksi, keterangan: laporan.keterangan }).session(session);
      for (const item of barang) {
        const product = await ModelBarang.findById(item._id).session(session);
        const barangMasuk = new ModelMasuk({
          tanggal: tgl_transaksi,
          kode_barang: product.kode_barang,
          nama_barang: product.nama_barang,
          qty_masuk: item.vol,
          keterangan: keterangan,
          harga_satuan: Number(item.harga),
        });
        await barangMasuk.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        message: "Laporan updated successfully, stock and barang masuk adjusted",
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