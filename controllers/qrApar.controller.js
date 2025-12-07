const { ModelQrApar } = require("../models/main.model");
const cloudinary = require("../utils/cloudinary");
const QRCode = require("qrcode");

exports.createQrApar = async (req, res) => {
    try {
      const { jenis, outlet, marketing, tanggal_exp, tanggal_isi } = req.body;
  
      if (!jenis || !outlet || !marketing || !tanggal_exp || !tanggal_isi) {
        return res.status(400).json({ message: "Harap isi semua field yang diperlukan!" });
      }
  
      // 1) Simpan data dulu untuk mendapatkan _id
      const newQrApar = new ModelQrApar({
        jenis,
        outlet,
        marketing,
        tanggal_exp,
        tanggal_isi,
      });
  
      await newQrApar.save(); // setelah ini kita punya _id
  
      // 2) Buat URL tujuan QR
      const qrTargetUrl = `https://yourdomain.com/qr-apar/${newQrApar._id}`;
  
      // 3) Generate QR base64
      const qrBase64 = await QRCode.toDataURL(qrTargetUrl);
  
      // 4) Upload QR ke Cloudinary
      const uploadQR = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload(qrBase64, {
            folder: "qrApar",
            public_id: newQrApar._id.toString(),
            overwrite: true,
          })
          .then(resolve)
          .catch(reject);
      });
  
      // 5) Update data dengan URL QR
      newQrApar.fotoQr = uploadQR.secure_url;
      await newQrApar.save();
  
      res.status(201).json({
        message: "QR APAR berhasil dibuat",
        data: newQrApar,
      });
  
    } catch (error) {
      console.error("Error createQrApar:", error);
      res.status(500).json({ message: "Terjadi kesalahan di server" });
    }
  };
  


exports.getAllQrApar = async (req, res) => {
  try {
    const qrAparList = await ModelQrApar.find();
    res.status(200).json({ status: "success", data: qrAparList });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}

exports.getQrAparById = async (req, res) => {
  try {
    const { id } = req.params;
    const qrApar = await ModelQrApar.findById(id);

    if (!qrApar) {
      return res
        .status(404)
        .json({ status: "error", message: "QR APAR tidak ditemukan" });
    }

    res.status(200).json({ status: "success", data: qrApar });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}

