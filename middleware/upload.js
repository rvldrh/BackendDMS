// middleware/upload.js
const multer = require('multer');

const storage = multer.memoryStorage(); // simpan di memori

const upload = multer({ storage });

module.exports = upload;
