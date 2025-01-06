const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SchemaBarang = new mongoose.Schema(
  {
    kode_barang: { type: String, required: true, unique: true },
    nama_barang: { type: String, required: true },
    satuan: { type: String, required: true },
    harga: { type: Number, required: true },
    stok_awal: { type: Number, required: true },
    masuk: { type: Number, required: false },
    keluar: { type: Number, required: false },
    stok_akhir: { type: Number, required: true },
  },
  { collection: "katalog_barang" }
);

const SchemaLaporan = new mongoose.Schema(
  {
    tgl_transaksi: { type: String, required: true },
    supplier: { type: String, required: true },
    barang: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          ref: "katalog_barang",
          required: true,
        },
        total: { type: Number, required: true },
        discount: { type: Number, required: true },
        vol: { type: Number, required: true },
      },
    ],
    ongkir: { type: Number, required: true },
    discount: { type: Number, required: true },
    grand_total: { type: Number, required: true },
    status: { type: String, required: true },
    tgl_pelunasan: { type: String, required: true },
    keterangan: { type: String, required: true },
  },
  { collection: "laporan_pembelian_barang" }
);

const SchemaMasuk = new mongoose.Schema(
  {
    tanggal: { type: String, required: true },
    kode_barang: { type: String, required: true },
    nama_barang: { type: String, required: true },
    qty_masuk: { type: Number, required: true },
    keterangan: { type: String, required: true },
  },
  { collection: "barang_masuk" }
)

const SchemaKeluar = new mongoose.Schema(
  {
    tanggal: { type: String, required: true },
    kode_barang: { type: String, required: true },
    nama_barang: { type: String, required: true },
    qty_keluar: { type: Number, required: true },
    keterangan: { type: String, required: true },
  },
  { collection: "barang_keluar" }
)

const SchemaLaporanPenjualan = new mongoose.Schema(
  {
    tanggal: { type: String, required: true },
    no_invoice: { type: String, required: true },
    tgl_jatuhTempo: { type: String, required: true },
    item: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          ref: "katalog_barang",
          required: true,
        },
        qty: { type: Number, required: true },
        jumlah: { type: Number, required: false },

      },
    ],
    subtotal : { type: Number, required: false },
    ppn : { type: Number, required: true },
    grand_total : { type: Number, required: false },
    kepada : { type: String, required: true },
  },
  { collection: "laporan_penjualan_barang" }
)

const ModelBarang = mongoose.model("katalog_barang", SchemaBarang);
const ModelLaporan = mongoose.model("laporan_pembelian_barang", SchemaLaporan);
const ModelMasuk = mongoose.model("barang_masuk", SchemaMasuk);
const ModelKeluar = mongoose.model("barang_keluar", SchemaKeluar);
const ModelLaporanPenjualan = mongoose.model("laporan_penjualan_barang", SchemaLaporanPenjualan);

module.exports = {
  ModelBarang,
  ModelLaporan,
  ModelMasuk,
  ModelKeluar,
  ModelLaporanPenjualan,
};