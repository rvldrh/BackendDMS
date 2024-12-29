const { ModelLaporan, ModelBarang } = require("../models/main.model");
const mongoose = require("mongoose");

exports.addLaporan = async (req, res) => {
  try {
      const { tgl_transaksi, supplier, barang, ongkir, discount, status, tgl_pelunasan, keterangan } = req.body;

      if (!tgl_transaksi || !supplier || !barang || !ongkir || discount === undefined || !status || !tgl_pelunasan || !keterangan) {
          return res.status(400).json({ message: "Missing required fields" });
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
          let total = 0;

          for (const item of barang) {
              const { _id, vol } = item;

              const product = await ModelBarang.findById(_id).session(session);
              if (!product) {
                  throw new Error(`Barang dengan ID ${_id} tidak ditemukan.`);
              }

              const itemTotal = product.harga * vol;
              item.total = itemTotal;
              total += itemTotal;

              product.masuk += vol;
              product.stok_akhir = product.stok_awal + product.masuk - product.keluar;

              await product.save({ session });
          }

          const discountValue = total * Number.parseFloat(discount);
          const grand_total = total - discountValue + ongkir;

          const newLaporan = new ModelLaporan({
              tgl_transaksi,
              supplier,
              barang,
              ongkir,
              discount: Number.parseFloat(discount),
              grand_total,
              total,
              status,
              tgl_pelunasan,
              keterangan,
          });

          await newLaporan.save({ session });

          await session.commitTransaction();
          session.endSession();

          res.status(201).json({
              message: "Laporan created successfully and stock updated",
              data: newLaporan,
          });
      } catch (err) {
          await session.abortTransaction();
          session.endSession();
          throw err;
      }
  } catch (err) {
      res.status(500).json({
          message: "Error creating laporan",
          error: err.message,
      });
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
      res.status(500).json({ message: "Error retrieving laporan", error: err.message });
  }
};