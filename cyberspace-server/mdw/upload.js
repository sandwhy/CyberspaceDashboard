const multer = require('multer');
const path = require('path');

// 1. Configure Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Save as a temp file first
    cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// 2. File Filter (Security)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const isMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (isMatch) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png, webp) are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;