const { ModelLaporanPenjualan, ModelBarang, ModelKeluar } = require("../models/main.model");
const mongoose = require("mongoose");

exports.addLaporanPenjualan = async (req, res) => {
  try {
    const { tanggal, no_invoice, tgl_jatuhTempo, item, ppn, kepada, basicOutlet } = req.body;

    // Validasi input
    if (!tanggal || !no_invoice || !tgl_jatuhTempo || !Array.isArray(item) || item.length === 0 || ppn === undefined || !kepada || !basicOutlet) {
      return res.status(400).json({ message: "Missing or invalid required fields" });
    }

    // Validasi ppn adalah angka
    if (isNaN(ppn) || ppn < 0) {
      return res.status(400).json({ message: "PPN must be a valid non-negative number" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let subtotal = 0;
      const updatedItems = [];
      const barangKeluarRecords = [];

      for (const product of item) {
        const { _id, qty } = product;

        // Validasi ObjectId
        if (!mongoose.Types.ObjectId.isValid(_id)) {
          throw new Error(`Invalid ObjectId: ${_id}`);
        }

        // Validasi qty adalah angka positif
        if (!Number.isInteger(qty) || qty <= 0) {
          throw new Error(`Invalid quantity for item with ID ${_id}: qty must be a positive integer`);
        }

        const barang = await ModelBarang.findById(_id).session(session);
        if (!barang) {
          throw new Error(`Barang dengan ID ${_id} tidak ditemukan.`);
        }

        // Validasi stok
        if (barang.stok_akhir < qty) {
          throw new Error(`Stok barang ${barang.nama_barang} tidak mencukupi.`);
        }

        // Validasi array harga
        if (!barang.harga || barang.harga.length === 0) {
          throw new Error(`Harga untuk barang ${barang.nama_barang} tidak tersedia.`);
        }

        // Validasi total sisa_qty
        const totalSisaQty = barang.harga.reduce((sum, entry) => sum + (Number.isFinite(entry.sisa_qty) ? entry.sisa_qty : 0), 0);
        if (totalSisaQty < qty) {
          throw new Error(`Total sisa qty untuk barang ${barang.nama_barang} tidak mencukupi (sisa: ${totalSisaQty}, dibutuhkan: ${qty}).`);
        }

        let remainingQty = qty;
        let itemTotal = 0;
        let lastHargaSatuan = barang.harga[0].harga; // Default harga satuan untuk ModelKeluar

        // Iterasi melalui array harga untuk mengurangi sisa_qty (FIFO)
        for (let i = 0; i < barang.harga.length && remainingQty > 0; i++) {
          const entry = barang.harga[i];

          // Validasi harga dan sisa_qty pada entri
          if (!Number.isFinite(entry.harga) || entry.harga <= 0) {
            throw new Error(`Harga pada entri ${i + 1} untuk barang ${barang.nama_barang} tidak valid.`);
          }
          if (!Number.isFinite(entry.sisa_qty) || entry.sisa_qty < 0) {
            throw new Error(`Sisa qty pada entri ${i + 1} untuk barang ${barang.nama_barang} tidak valid.`);
          }

          // Tentukan jumlah yang bisa diambil dari entri ini
          const qtyToTake = Math.min(remainingQty, entry.sisa_qty);

          if (qtyToTake > 0) {
            // Kurangi sisa_qty
            entry.sisa_qty -= qtyToTake;
            // Hitung total untuk qty yang diambil dari entri ini
            itemTotal += qtyToTake * entry.harga;
            // Update remainingQty
            remainingQty -= qtyToTake;
            // Simpan harga satuan terakhir untuk ModelKeluar
            lastHargaSatuan = entry.harga;
          }
        }

        // Pastikan semua qty telah dipenuhi
        if (remainingQty > 0) {
          throw new Error(`Gagal memenuhi qty untuk barang ${barang.nama_barang}: sisa qty tidak cukup.`);
        }

        subtotal += itemTotal;

        // Update stok barang
        barang.keluar += qty;
        barang.stok_akhir -= qty;
        await barang.save({ session });

        // Simpan item untuk laporan penjualan
        updatedItems.push({
          _id: barang._id,
          qty,
          jumlah: itemTotal,
        });

        // Simpan data untuk barang_keluar
        barangKeluarRecords.push({
          tanggal,
          kode_barang: barang.kode_barang,
          nama_barang: barang.nama_barang,
          qty_keluar: qty,
          keterangan: kepada,
          harga_satuan: lastHargaSatuan,
        });
      }

      const ppnValue = subtotal * Number.parseFloat(ppn);
      const grand_total = subtotal + ppnValue;

      // Validasi subtotal dan grand_total
      if (!Number.isFinite(subtotal) || !Number.isFinite(grand_total)) {
        throw new Error("Subtotal or grand_total is not a valid number");
      }

      const newLaporanPenjualan = new ModelLaporanPenjualan({
        tanggal,
        no_invoice,
        tgl_jatuhTempo,
        item: updatedItems,
        ppn: Number.parseFloat(ppn),
        subtotal,
        grand_total,
        kepada,
        basicOutlet,
      });

      const savedLaporan = await newLaporanPenjualan.save({ session });

      // Tambahkan data ke tabel barang_keluar
      for (const keluar of barangKeluarRecords) {
        const newBarangKeluar = new ModelKeluar(keluar);
        await newBarangKeluar.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        message: "Laporan Penjualan created successfully, sisa_qty updated",
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
      laporanPenjualan.kepada = kepada;

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
      laporanPenjualan.kepada = kepada;

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
