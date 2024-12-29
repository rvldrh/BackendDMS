const { ModelLaporan, ModelBarang } = require("../models/main.model");
const mongoose = require("mongoose");

exports.addLaporan = async (req, res) => {
  try {
    const {
      tgl_transaksi,
      supplier,
      barang,
      ongkir,
      discount, // Diskon (misalnya 0.1 untuk 10%)
      status,
      tgl_pelunasan,
      keterangan,
    } = req.body;

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

    // Mulai transaksi database
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let total = 0;

      // Iterasi setiap barang untuk menghitung total harga
      for (const item of barang) {
        const { _id, vol } = item;

        // Ambil data barang berdasarkan ID
        const product = await ModelBarang.findById(_id)
          .session(session)
        if (!product) {
          throw new Error(`Barang dengan ID ${_id} tidak ditemukan.`);
        }

        // Hitung harga total untuk barang ini
        const itemTotal = product.harga * vol; // harga satuan x vol
        item.total = itemTotal; // Tambahkan ke field `total` di barang
        total += itemTotal; // Tambahkan ke subtotal laporan

        // Perbarui stok barang
        product.masuk += vol;
        product.stok_akhir = product.stok_awal + product.masuk - product.keluar;

        // Simpan perubahan barang
        await product.save({ session });
      }

      // Hitung nilai grand total setelah diskon
      const discountValue = total * parseFloat(discount); // Diskon dalam bentuk angka
      const grand_total = total - discountValue + ongkir; // Total setelah diskon + ongkir

      // Buat dokumen laporan baru
      const newLaporan = new ModelLaporan({
        tgl_transaksi,
        supplier,
        barang,
        ongkir,
        discount: parseFloat(discount), // Diskon disimpan dalam bentuk angka
        grand_total,
        total,
        status,
        tgl_pelunasan,
        keterangan,
      });

      // Simpan laporan ke database
      await newLaporan.save({ session });

      // Commit transaksi
      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        message: "Laporan created successfully and stock updated",
        data: newLaporan,
      });
    } catch (err) {
      // Rollback transaksi jika terjadi kesalahan
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
    // Menggunakan population untuk mengambil data lengkap barang dari koleksi katalog_barang
    const laporan = await ModelLaporan.find()
      .populate("barang._id", "satuan stok_awal stok_akhir harga") // Pilih field yang ingin ditampilkan dari katalog_barang
      .exec(); // Eksekusi query

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
