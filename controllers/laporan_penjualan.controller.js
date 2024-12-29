const { ModelLaporanPenjualan, ModelBarang } = require("../models/main.model");  
const  mongoose = require("mongoose");

exports.addLaporanPenjualan = async (req, res) => {
    try {
        const { tanggal, no_invoice, tgl_jatuhTempo, item, ppn } = req.body;

        if (!tanggal || !no_invoice || !tgl_jatuhTempo || !item || ppn === undefined) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
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

            const newLaporanPenjualan = new ModelLaporanPenjualan({
                tanggal,
                no_invoice,
                tgl_jatuhTempo,
                item,
                ppn: Number.parseFloat(ppn),
                grand_total,
                subtotal,
            });

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
        res.status(500).json({ message: "Error creating laporan penjualan", error: err.message });
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
        res.status(500).json({ message: "Error retrieving laporan_penjualan", error: err.message });
    }
};
