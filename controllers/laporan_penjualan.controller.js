const { ModelLaporanPenjualan, ModelBarang } = require("../models/main.model");  
const  mongoose = require("mongoose");

exports.getLaporanPenjualan = async (req, res) => {
  try {
    const result = await ModelLaporanPenjualan.find()
    .populate('item._id', 'harga satuan')
    .exec();
    res.status(200).json({
      message: "Data Laporan Penjualan",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data laporan penjualan",
      error: error.message,
    });
  }
};

exports.addLaporanPenjualan = async (req, res) => {
    try {
        const {
            tanggal,
            no_invoice,
            tgl_jatuhTempo,
            item,
            ppn, // PPN sebagai persentase (misalnya, 0.11 untuk 11%)
        } = req.body;

        if (!tanggal || !no_invoice || !tgl_jatuhTempo || !item || ppn === undefined) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Mulai transaksi database
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            let subtotal = 0;

            // Iterasi setiap item untuk menghitung jumlah dan subtotal
            for (const product of item) {
                const { _id, qty } = product;
                

                // Ambil data barang berdasarkan ID
                const barang = await ModelBarang.findById(_id).session(session);
                if (!barang) {
                    throw new Error(`Barang dengan ID ${_id} tidak ditemukan.`);
                }

                // Hitung jumlah (qty x harga satuan)
                const jumlah = qty * barang.harga;
                product.jumlahh = jumlah;

                // Tambahkan ke subtotal
                subtotal += jumlah;
            }

            // Hitung nilai PPN sebagai persentase dari subtotal
            const ppnValue = subtotal * parseFloat(ppn);

            // Hitung grand_total (subtotal + ppnValue)
            const grand_total = subtotal + ppnValue;

            // Buat dokumen laporan penjualan baru
            const newLaporanPenjualan = new ModelLaporanPenjualan({
                tanggal,
                no_invoice,
                tgl_jatuhTempo,
                item,
                subtotal,
                ppn: parseFloat(ppn), // Simpan PPN sebagai persentase
                grand_total,
            });

            // Simpan laporan ke database
            await newLaporanPenjualan.save({ session });

            // Commit transaksi
            await session.commitTransaction();
            session.endSession();

            res.status(201).json({
                message: "Laporan Penjualan berhasil dibuat",
                data: newLaporanPenjualan,
            });
        } catch (err) {
            // Rollback transaksi jika terjadi kesalahan
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    } catch (err) {
        res.status(500).json({
            message: "Terjadi kesalahan saat membuat laporan penjualan",
            error: err.message,
        });
    }
};

